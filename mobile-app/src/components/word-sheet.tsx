import { Modal, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanSearch, X } from 'lucide-react-native';

import { splitSyllables } from '../utils/syllables';
import { useOCRStore } from '../store/useStore';
import { GRADIENTS } from '../theme/palettes';
import { PressableScale } from './pressable-scale';
import { SpeakButton } from './speak-button';
import { useSpeech, useStopSpeechOnUnmount } from '../speech/use-speech';
import { useT } from '../i18n';
import { Blob, Ring, Sparkle } from './figma-decor';

/**
 * Word Isolation (Figma: overlay "ISOLASI KATA"). Satu kata ditampilkan besar
 * dan terpisah dari kalimatnya, lalu dipecah jadi suku kata — pil suku kata
 * berselang terang/redup supaya batas antar suku kata terlihat jelas.
 */
export function WordSheet({
  word,
  onClose,
  onExplain,
}: {
  word: string | null;
  onClose: () => void;
  /** Buka AI Explain This untuk kata ini; sheet ini ditutup lebih dulu. */
  onExplain?: (word: string) => void;
}) {
  const t = useT();
  const language = useOCRStore((s) => s.language);
  const syllables = word ? splitSyllables(word, language) : [];

  const { enabled: ttsEnabled, speak } = useSpeech();
  useStopSpeechOnUnmount();

  /*
   * Suku kata dibunyikan sendiri-sendiri, jadi tiap ketukan menghentikan bunyi
   * sebelumnya — itu memang yang diharapkan saat mengeja maju-mundur, dan
   * karena itu tidak memakai toggle seperti tombol paragraf.
   */
  const speakSyllable = (syllable: string) => speak(syllable, `syllable:${syllable}`);

  return (
    <Modal visible={!!word} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(0,0,0,0.52)' }}
        onPress={onClose}>
        {/* Menelan ketukan supaya menekan kartu tidak ikut menutup overlay. */}
        <Pressable className="w-full overflow-hidden rounded-3xl" onPress={() => {}}>
          <LinearGradient
            colors={[...GRADIENTS.isolationSheet.colors]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 20, overflow: 'hidden' }}>
            <Ring size={170} style={{ position: 'absolute', top: -30, right: -50 }} />
            <Blob size={90} opacity={0.05} style={{ position: 'absolute', bottom: -20, left: -20 }} />
            <Sparkle size={8} style={{ position: 'absolute', top: 24, right: 76 }} />
            <Sparkle size={8} style={{ position: 'absolute', bottom: 34, right: 30 }} />
            <Sparkle size={5} style={{ position: 'absolute', top: 92, left: 24 }} />

            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <ScanSearch size={15} color="rgba(255,255,255,0.7)" />
                <Text className="font-ui-bold text-xs text-white/70">{t.wordSheet.badge}</Text>
              </View>
              <PressableScale
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t.common.close}
                scaleTo={0.9}
                className="h-11 w-11 items-center justify-center rounded-[16px] bg-white/[0.15]">
                <X size={17} color="#ffffff" />
              </PressableScale>
            </View>

            <View className="mt-4 flex-row items-center" style={{ gap: 12 }}>
              <Text
                className="flex-1 font-read-bold text-white"
                style={{ fontSize: 40, lineHeight: 48 }}
                adjustsFontSizeToFit
                numberOfLines={1}>
                {word}
              </Text>
              {word ? <SpeakButton text={word} speechKey={`word:${word}`} onDark /> : null}
            </View>

            {/*
             * Ejaannya ditulis sebagai teks biasa yang renggang, bukan pil
             * berwarna seperti sebelumnya. Pil membuat tiap suku kata terlihat
             * sebagai objek tersendiri, padahal yang perlu dikenali pengguna
             * justru bentuk KATA yang sama seperti yang akan ditemuinya di
             * buku — hanya diberi jarak.
             */}
            <View className="mt-4 flex-row flex-wrap items-baseline">
              {syllables.map((syllable, index) => (
                <PressableScale
                  key={index}
                  onPress={() => speakSyllable(syllable)}
                  accessibilityRole="button"
                  accessibilityLabel={t.wordSheet.syllableLabel(syllable)}
                  scaleTo={0.9}
                  className="px-1.5 py-1">
                  <Text
                    className="font-read text-2xl text-white"
                    style={{ letterSpacing: 1.5, marginRight: index < syllables.length - 1 ? 14 : 0 }}>
                    {syllable}
                  </Text>
                </PressableScale>
              ))}
            </View>

            {syllables.length > 1 && ttsEnabled ? (
              <Text className="mt-1.5 px-1.5 font-ui-medium text-xs text-white/50">
                {t.wordSheet.syllableHint}
              </Text>
            ) : null}
          </LinearGradient>

          <View
            className="flex-row items-center justify-between bg-surface px-5 py-4"
            style={{ gap: 8 }}>
            <Text className="font-ui-bold text-[15px] text-text-main">
              {t.wordSheet.syllableCount(syllables.length)}
            </Text>

            <View className="flex-row items-center" style={{ gap: 8 }}>
              {word && onExplain ? (
                <PressableScale
                  onPress={() => onExplain(word)}
                  accessibilityRole="button"
                  accessibilityLabel={t.wordSheet.askLexiLabel(word)}
                  className="h-11 items-center justify-center rounded-2xl px-3">
                  <Text className="font-ui-bold text-sm text-text-muted">{t.common.askLexi}</Text>
                </PressableScale>
              ) : null}
              <PressableScale
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={t.common.close}
                className="h-11 items-center justify-center rounded-2xl bg-primary/10 px-5">
                <Text className="font-ui-bold text-[15px] text-primary">{t.common.close}</Text>
              </PressableScale>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
