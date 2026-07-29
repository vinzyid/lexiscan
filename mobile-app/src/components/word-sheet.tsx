import { Modal, View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanSearch, X } from 'lucide-react-native';

import { splitSyllables } from '../utils/syllables';
import { GRADIENTS } from '../theme/palettes';
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
  const syllables = word ? splitSyllables(word) : [];

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
                <ScanSearch size={14} color="rgba(255,255,255,0.7)" />
                <Text className="font-ui-bold text-[10px] text-white/70">ISOLASI KATA</Text>
              </View>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Tutup"
                className="h-8 w-8 items-center justify-center rounded-[14px] bg-white/[0.15]">
                <X size={14} color="#ffffff" />
              </Pressable>
            </View>

            <Text
              className="mt-4 font-read-bold text-white"
              style={{ fontSize: 40, lineHeight: 48 }}
              adjustsFontSizeToFit
              numberOfLines={1}>
              {word}
            </Text>

            <View className="mt-4 flex-row flex-wrap items-center" style={{ gap: 5 }}>
              {syllables.map((syllable, index) => (
                <View key={index} className="flex-row items-center" style={{ gap: 5 }}>
                  <View className="rounded-[14px] bg-white/[0.14] px-3 py-1.5">
                    <Text
                      className="font-read-bold text-base"
                      style={{ color: index % 2 === 0 ? '#ffffff' : 'rgba(255,255,255,0.6)' }}>
                      {syllable}
                    </Text>
                  </View>
                  {index < syllables.length - 1 ? (
                    <Text className="font-ui-light text-xl text-white/30">·</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </LinearGradient>

          <View
            className="flex-row items-center justify-between bg-surface px-5 py-4"
            style={{ gap: 8 }}>
            <Text className="font-ui-bold text-[13px] text-text-main">
              {syllables.length} suku kata
            </Text>

            <View className="flex-row items-center" style={{ gap: 8 }}>
              {word && onExplain ? (
                <Pressable
                  onPress={() => onExplain(word)}
                  accessibilityRole="button"
                  className="rounded-2xl px-3 py-2.5">
                  <Text className="font-ui-bold text-[13px] text-text-muted">Tanya Lexi</Text>
                </Pressable>
              ) : null}
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                className="rounded-2xl bg-primary/10 px-5 py-2.5">
                <Text className="font-ui-bold text-sm text-primary">Tutup</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
