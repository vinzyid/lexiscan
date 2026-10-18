import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Volume2 } from 'lucide-react-native';

import { PressableScale } from '../src/components/pressable-scale';
import { speak, stop } from '../src/speech/speech-service';
import { resolveVoice } from '../src/speech/voices';
import { useOCRStore } from '../src/store/useStore';
import { useThemeColors } from '../src/theme/theme-provider';
import { getReadingLevel } from '../src/theme/reading-levels';

/**
 * Layar tersembunyi untuk memilih ejaan pengganti suku kata (lihat
 * `src/speech/syllable-speech.ts`). Dibuka dari layar Uji Energi.
 *
 * Calon-calonnya diputar dengan suara dan kecepatan yang sama persis dengan
 * mode Eja, jadi yang terdengar di sini adalah yang akan terdengar anak.
 * Teksnya sengaja tidak diterjemahkan: ini alat tim, bukan bagian aplikasi.
 */
function candidates(syllable: string): string[] {
  const s = syllable.trim().toLowerCase();
  if (s.length === 0) return [];

  const list = [
    s,
    `${s}.`,
    s.replace(/e/g, 'ê'),
    s.replace(/e/g, 'é'),
    s.replace(/e/g, 'è'),
    s.replace(/e/g, 'ə'),
    `${s}h`,
    `${s}-`,
    `<speak>${s}</speak>`,
    `<speak><lang xml:lang="id-ID">${s}</lang></speak>`,
  ];

  return [...new Set(list)];
}

export default function PronunciationTestScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();

  const language = useOCRStore((s) => s.language);
  const voiceId = useOCRStore((s) => s.voiceIds[s.language]);
  const customRate = useOCRStore((s) => s.speechRate);
  const readingLevel = useOCRStore((s) => s.readingLevel);
  const rate = customRate ?? getReadingLevel(readingLevel).speechRate;

  const [syllable, setSyllable] = useState('me');
  const [free, setFree] = useState('menyimpan');
  const [voice, setVoice] = useState<string | undefined>();
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    void resolveVoice(language, voiceId).then(setVoice);
  }, [language, voiceId]);

  useEffect(
    () => () => {
      void stop();
    },
    [],
  );

  const list = useMemo(() => candidates(syllable), [syllable]);

  const play = (text: string) => {
    setPlaying(text);
    void speak(text, {
      language,
      rate,
      voice: voiceId,
      onSettled: () => setPlaying((current) => (current === text ? null : current)),
    });
  };

  const row = (text: string, index?: number) => (
    <PressableScale
      key={`${index ?? "free"}:${text}`}
      onPress={() => play(text)}
      accessibilityRole="button"
      className={`h-14 flex-row items-center rounded-2xl px-4 ${
        playing === text ? 'bg-primary/20' : 'bg-surface'
      }`}
      style={{ gap: 12 }}>
      <Volume2 size={18} color={colors.primary} />
      {index !== undefined ? (
        <Text className="w-6 font-ui-bold text-[15px] text-text-muted">{index + 1}</Text>
      ) : null}
      <Text className="flex-1 font-read text-[18px] text-text-main" numberOfLines={1}>
        {text}
      </Text>
    </PressableScale>
  );

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 32,
          paddingHorizontal: 20,
          gap: 10,
        }}>
        <View className="flex-row items-center" style={{ gap: 12 }}>
          <PressableScale
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            className="h-11 w-11 items-center justify-center rounded-2xl bg-surface-alt">
            <ArrowLeft size={20} color={colors.textMuted} />
          </PressableScale>
          <Text className="font-ui-bold text-[22px] text-text-main">Uji Lafal</Text>
        </View>

        <Text className="font-ui-medium text-[14px] leading-6 text-text-muted">
          Ketik suku kata yang salah bunyi saat mengeja, lalu putar tiap calon di bawah. Catat nomor
          calon yang bunyinya paling benar (mis. &quot;me&quot; seperti di &quot;menyimpan&quot;).
        </Text>
        <Text className="font-ui-medium text-[13px] text-text-muted">
          Suara: {voice ?? 'bawaan HP'} · kecepatan {rate.toFixed(2)}
        </Text>

        <TextInput
          value={syllable}
          onChangeText={setSyllable}
          autoCapitalize="none"
          autoCorrect={false}
          className="rounded-2xl bg-surface px-4 py-3 font-read text-[18px] text-text-main"
          style={{ borderWidth: 1, borderColor: colors.border }}
        />

        {list.map((text, index) => row(text, index))}

        <Text className="mt-4 font-ui-bold text-[13px] uppercase text-text-muted">Teks bebas</Text>
        <TextInput
          value={free}
          onChangeText={setFree}
          autoCapitalize="none"
          autoCorrect={false}
          className="rounded-2xl bg-surface px-4 py-3 font-read text-[18px] text-text-main"
          style={{ borderWidth: 1, borderColor: colors.border }}
        />
        {free.trim().length > 0 ? row(free.trim()) : null}
      </ScrollView>
    </View>
  );
}
