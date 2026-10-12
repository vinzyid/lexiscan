import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Timer } from 'lucide-react-native';

import { useT } from '../../src/i18n';
import { useThemeColors } from '../../src/theme/theme-provider';
import { DyslexicText } from '../../src/components/dyslexic-text';
import { SpeakButton } from '../../src/components/speak-button';
import { ScreenBackdrop } from '../../src/components/figma-decor';
import { ProgressButton, ProgressLabel } from '../../src/components/progress-kit';

/**
 * Layar sesi baca dengan timer.
 *
 * Timer mulai berjalan saat pembaca menekan "mulai", bukan saat layar terbuka:
 * membaca kondisi baseline/berbantuan harus dihitung dari saat pembaca benar-
 * benar mulai, bukan saat ia masih menyesuaikan posisi. Waktu dihitung dari
 * selisih jam, bukan penghitung interval, supaya tidak melenceng kalau JavaScript
 * sempat tertunda.
 */
export default function ProgressReadScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const t = useT();

  const params = useLocalSearchParams<{
    sessionId: string;
    documentId: string;
    groupId: string;
    condition: string;
    title: string;
    text: string;
  }>();

  const paragraphs = useMemo(
    () =>
      (params.text ?? '')
        .split(/\n{2,}|\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [params.text],
  );

  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      if (startedAt.current !== null) {
        setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [running]);

  const begin = () => {
    startedAt.current = Date.now();
    setSeconds(0);
    setRunning(true);
  };

  const finish = () => {
    setRunning(false);
    const elapsed = startedAt.current ? Math.floor((Date.now() - startedAt.current) / 1000) : seconds;
    router.replace({
      pathname: '/progress/assess',
      params: {
        ...params,
        durationSeconds: String(Math.max(1, elapsed)),
      },
    });
  };

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const wordCount = paragraphs.join(' ').split(/\s+/).filter(Boolean).length;

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />

      {/* Timer menempel di atas supaya tidak ikut tergulung saat membaca. */}
      <View
        className="flex-row items-center justify-between border-b border-border/10 bg-surface/70 px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}>
        <View className="flex-1">
          <Text className="font-ui-bold text-[15px] text-text-main" numberOfLines={1}>
            {params.title ?? t.lexiprogress.readingTitle}
          </Text>
          <Text className="font-ui-medium text-[12px] text-text-muted">
            {params.condition === 'assisted' ? t.lexiprogress.assisted : t.lexiprogress.baseline}
          </Text>
        </View>
        <View className="flex-row items-center rounded-2xl bg-primary/[0.1] px-3 py-2" style={{ gap: 6 }}>
          <Timer size={15} color={colors.primary} />
          <Text className="font-ui-bold text-[15px] text-primary">{mmss}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        {paragraphs.map((paragraph, index) => (
          <View key={index} className="mb-4 rounded-2xl border border-border/10 bg-surface p-4">
            <View className="mb-2 flex-row items-center justify-between">
              <ProgressLabel>
                {t.reader.paragraphOf(index + 1, paragraphs.length)}
              </ProgressLabel>
              <SpeakButton text={paragraph} speechKey={`progress:${index}`} size={16} />
            </View>
            <DyslexicText>{paragraph}</DyslexicText>
          </View>
        ))}
      </ScrollView>

      {/* Kontrol sesi di bawah, selalu terjangkau ibu jari. */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
        {!running ? (
          <ProgressButton label={t.lexiprogress.tapToStart} onPress={begin} />
        ) : (
          <View style={{ gap: 8 }}>
            <ProgressButton label={t.lexiprogress.finishReading} onPress={finish} />
            <ProgressButton
              label={t.lexiprogress.notYet}
              tone="soft"
              onPress={() => {
                setRunning(false);
                setSeconds(0);
                startedAt.current = null;
              }}
            />
          </View>
        )}
        <Text className="mt-3 px-2 text-center font-ui-medium text-[12px] leading-5 text-text-muted">
          {t.lexiprogress.readingHint}
          {wordCount > 0 ? ` (${wordCount} ${t.lexiprogress.goalNoValue})` : ''}
        </Text>
      </View>
    </View>
  );
}
