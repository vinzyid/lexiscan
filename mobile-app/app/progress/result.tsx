import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Minus, X } from 'lucide-react-native';

import * as progressApi from '../../src/api/lexiprogress';
import { useT } from '../../src/i18n';
import { useThemeColors } from '../../src/theme/theme-provider';
import { ScreenBackdrop } from '../../src/components/figma-decor';
import {
  ProgressButton,
  ProgressCard,
  ProgressLabel,
  ProgressScreen,
} from '../../src/components/progress-kit';

function formatNumber(value: number | null, suffix = ''): string {
  return value === null ? '' : `${value}${suffix}`;
}

export default function ProgressResultScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const t = useT();

  const { sessionId, groupId } = useLocalSearchParams<{ sessionId: string; groupId: string }>();

  const [session, setSession] = useState<progressApi.ProgressSession | null>(null);
  const [comparison, setComparison] = useState<progressApi.ProgressComparison | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ session: loaded }] = await Promise.all([progressApi.fetchSession(Number(sessionId))]);
      setSession(loaded);
      if (groupId) {
        const cmp = await progressApi.fetchComparison(groupId);
        setComparison(cmp);
      }
    } catch {
      // Diamkan: layar hasil tetap menampilkan apa yang berhasil dimuat.
    } finally {
      setLoading(false);
    }
  }, [sessionId, groupId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const hasPair = comparison?.baseline && comparison?.assisted;

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}>
        <ProgressScreen
          title={t.lexiprogress.resultTitle}
          subtitle={
            session?.condition === 'assisted'
              ? t.lexiprogress.resultAssisted
              : t.lexiprogress.resultBaseline
          }
          onBack={() => router.replace('/progress/index' as never)}
        />

        {loading && !session ? <ActivityIndicator color={colors.primary} size="large" /> : null}

        {session ? (
          <>
            {/* ── Nilai mentah ─────────────────────────────────────────── */}
            <ProgressCard className="mb-3">
              <ProgressLabel>{t.lexiprogress.rawValues}</ProgressLabel>
              <Text className="mt-2 font-ui-bold text-[16px] text-text-main">
                {session.document?.title ?? t.lexiprogress.noData}
              </Text>
              <View className="mt-3" style={{ gap: 8 }}>
                <RawRow label={t.lexiprogress.duration} value={session.duration_seconds === null ? t.lexiprogress.notMeasured : `${session.duration_seconds} ${t.lexiprogress.metrics.duration_seconds.unit}`} />
                <RawRow label={t.lexiprogress.comprehension} value={session.comprehension_percent === null ? t.lexiprogress.notMeasured : `${session.comprehension_correct}/${session.comprehension_total} (${session.comprehension_percent}%)`} />
                <RawRow label="WPM" value={session.wpm === null ? t.lexiprogress.notMeasured : formatNumber(session.wpm)} />
                <RawRow label={t.lexiprogress.difficulty} value={session.difficulty_rating === null ? t.lexiprogress.notMeasured : `${session.difficulty_rating}/5`} />
                {session.features.length > 0 ? (
                  <RawRow
                    label={t.lexiprogress.features}
                    value={session.features
                      .map((key) => t.lexiprogress.featureNames[key as keyof typeof t.lexiprogress.featureNames] ?? key)
                      .join(', ')}
                  />
                ) : null}
              </View>
            </ProgressCard>

            {/* ── Perbandingan ─────────────────────────────────────────── */}
            <ProgressCard className="mb-3">
              <ProgressLabel>{t.lexiprogress.compareTitle}</ProgressLabel>
              {hasPair ? (
                <View className="mt-3" style={{ gap: 10 }}>
                  {(
                    [
                      ['comprehension_percent', t.lexiprogress.comprehension],
                      ['wpm', 'WPM'],
                      ['duration_seconds', t.lexiprogress.duration],
                      ['difficulty_rating', t.lexiprogress.difficulty],
                    ] as const
                  ).map(([key, label]) => {
                    const change = comparison?.changes[key];
                    if (!change) return null;
                    return (
                      <CompareRow
                        key={key}
                        label={label}
                        baseline={change.baseline}
                        assisted={change.assisted}
                        percentagePoints={change.percentage_points}
                        relativePercent={change.relative_percent}
                      />
                    );
                  })}
                  <Text className="mt-1 font-ui-medium text-[11px] leading-4 text-text-muted">
                    {t.lexiprogress.points} · {t.lexiprogress.relative}.{' '}
                    {t.lexiprogress.limitation}
                  </Text>
                </View>
              ) : (
                <Text className="mt-2 font-ui-medium text-[13px] leading-5 text-text-muted">
                  {t.lexiprogress.compareEmpty}
                </Text>
              )}
            </ProgressCard>

            {/* ── Tinjauan kuis ────────────────────────────────────────── */}
            {session.quiz_items.length > 0 ? (
              <ProgressCard className="mb-4">
                <ProgressLabel>{t.lexiprogress.quizReview}</ProgressLabel>
                <View className="mt-3" style={{ gap: 12 }}>
                  {session.quiz_items.map((item) => (
                    <View key={item.id ?? item.order_index} className="rounded-2xl bg-background p-3">
                      <View className="flex-row items-start" style={{ gap: 8 }}>
                        <StatusIcon
                          status={item.is_correct === true ? 'correct' : item.is_correct === false ? 'wrong' : 'skipped'}
                          colors={colors}
                        />
                        <Text className="flex-1 font-ui-semibold text-[14px] text-text-main">
                          {item.question}
                        </Text>
                      </View>
                      <Text className="mt-2 font-ui-medium text-[12px] text-text-muted">
                        {item.chosen_option === null
                          ? t.lexiprogress.answeredSkipped
                          : `${t.lexiprogress.answeredCorrect}: ${item.options[item.correct_option] ?? ''}`}
                      </Text>
                    </View>
                  ))}
                </View>
              </ProgressCard>
            ) : null}
          </>
        ) : null}

        <View style={{ gap: 8 }}>
          <ProgressButton label={t.lexiprogress.viewHistory} onPress={() => router.replace('/progress/index' as never)} />
          <ProgressButton
            label={t.lexiprogress.startAnother}
            tone="soft"
            onPress={() => router.replace('/progress/setup' as never)}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function RawRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between" style={{ gap: 12 }}>
      <Text className="font-ui-medium text-[13px] text-text-muted">{label}</Text>
      <Text className="flex-1 text-right font-ui-semibold text-[13px] text-text-main">{value}</Text>
    </View>
  );
}

function CompareRow({
  label,
  baseline,
  assisted,
  percentagePoints,
  relativePercent,
}: {
  label: string;
  baseline: number | null;
  assisted: number | null;
  percentagePoints: number | null;
  relativePercent: number | null;
}) {
  const t = useT();
  const canCompare = baseline !== null && assisted !== null;

  return (
    <View className="rounded-2xl bg-background p-3">
      <Text className="font-ui-bold text-[13px] text-text-main">{label}</Text>
      <View className="mt-2 flex-row justify-between">
        <Text className="font-ui-medium text-[12px] text-text-muted">
          {t.lexiprogress.baseline}: {baseline === null ? t.lexiprogress.notMeasured : baseline}
        </Text>
        <Text className="font-ui-medium text-[12px] text-text-muted">
          {t.lexiprogress.assisted}: {assisted === null ? t.lexiprogress.notMeasured : assisted}
        </Text>
      </View>
      <Text className="mt-1 font-ui-semibold text-[12px] text-primary">
        {!canCompare
          ? t.lexiprogress.notMeasured
          : percentagePoints !== null
            ? `${percentagePoints >= 0 ? '+' : ''}${percentagePoints} ${t.lexiprogress.points}${
                relativePercent !== null ? ` · ${relativePercent >= 0 ? '+' : ''}${relativePercent}% ${t.lexiprogress.relative}` : ''
              }`
            : relativePercent !== null
              ? `${relativePercent >= 0 ? '+' : ''}${relativePercent}% ${t.lexiprogress.relative}`
              : t.lexiprogress.noData}
      </Text>
    </View>
  );
}

function StatusIcon({
  status,
  colors,
}: {
  status: 'correct' | 'wrong' | 'skipped';
  colors: ReturnType<typeof useThemeColors>;
}) {
  if (status === 'correct') {
    return (
      <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
        <Check size={14} color={colors.success} />
      </View>
    );
  }
  if (status === 'wrong') {
    return (
      <View className="h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
        <X size={14} color="#ef4444" />
      </View>
    );
  }
  return (
    <View className="h-6 w-6 items-center justify-center rounded-full bg-surface-alt">
      <Minus size={14} color={colors.textMuted} />
    </View>
  );
}
