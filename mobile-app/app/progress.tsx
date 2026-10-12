import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, BookOpen, Clock3, Target } from 'lucide-react-native';

import * as progressApi from '../src/api/lexiprogress';
import { useT } from '../src/i18n';
import { PressableScale } from '../src/components/pressable-scale';
import { ScreenBackdrop } from '../src/components/figma-decor';
import { useThemeColors } from '../src/theme/theme-provider';

export default function LexiProgressScreen() {
  const router = useRouter();
  const t = useT();
  const colors = useThemeColors();
  const [overview, setOverview] = useState<progressApi.ProgressOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setOverview(await progressApi.fetchOverview());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={{ paddingTop: 54, paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}>
        <View className="mb-5 flex-row items-center" style={{ gap: 12 }}>
          <PressableScale onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Kembali" className="h-10 w-10 items-center justify-center rounded-full bg-surface">
            <ArrowLeft size={19} color={colors.textMain} />
          </PressableScale>
          <View className="flex-1">
            <Text className="font-ui-bold text-[24px] text-text-main">{t.lexiprogress.title}</Text>
            <Text className="mt-1 font-ui-medium text-[13px] leading-5 text-text-muted">{t.lexiprogress.subtitle}</Text>
          </View>
        </View>

        {loading && !overview ? <ActivityIndicator color={colors.primary} size="large" /> : null}
        {error ? <Message text="Tidak bisa memuat progres. Tarik layar untuk mencoba lagi." /> : null}
        {overview && overview.sessions_completed === 0 ? (
          <View className="rounded-3xl bg-surface p-5">
            <BookOpen size={28} color={colors.primary} />
            <Text className="mt-3 font-ui-bold text-[17px] text-text-main">{t.lexiprogress.empty}</Text>
            <Text className="mt-2 font-ui-medium text-[13px] leading-5 text-text-muted">{t.lexiprogress.feedback}</Text>
          </View>
        ) : null}
        {overview && overview.sessions_completed > 0 ? <ProgressContent overview={overview} /> : null}
      </ScrollView>
    </View>
  );
}

function ProgressContent({ overview }: { overview: progressApi.ProgressOverview }) {
  const t = useT();
  const colors = useThemeColors();
  const latest = overview.latest_session;
  return (
    <>
      <View className="mb-3 flex-row" style={{ gap: 10 }}>
        <Stat icon={<BookOpen size={18} color={colors.primary} />} value={`${overview.sessions_completed}`} label={t.lexiprogress.completedSessions} />
        <Stat icon={<Target size={18} color={colors.primary} />} value={`${overview.goals.length}`} label={t.lexiprogress.activeGoals} />
      </View>
      {latest ? <View className="mb-3 rounded-3xl bg-surface p-5">
        <Text className="font-ui-bold text-[11px] uppercase text-text-muted">{t.lexiprogress.latestSession}</Text>
        <View className="mt-2 flex-row items-center" style={{ gap: 8 }}>
          <Text className="font-ui-bold text-[18px] text-text-main">{latest.document?.title ?? t.lexiprogress.noData}</Text>
          <Text className="rounded-xl bg-primary/10 px-2 py-1 font-ui-bold text-[11px] text-primary">{latest.condition === 'baseline' ? t.lexiprogress.baseline : t.lexiprogress.assisted}</Text>
        </View>
        <View className="mt-4 flex-row" style={{ gap: 18 }}>
          <Metric label={t.lexiprogress.duration} value={latest.duration_seconds == null ? t.lexiprogress.notMeasured : `${latest.duration_seconds} dtk`} />
          <Metric label={t.lexiprogress.comprehension} value={latest.comprehension_percent == null ? t.lexiprogress.notMeasured : `${latest.comprehension_percent}%`} />
          <Metric label={t.lexiprogress.difficulty} value={latest.difficulty_rating == null ? t.lexiprogress.notMeasured : `${latest.difficulty_rating}/5`} />
        </View>
      </View> : null}
      {overview.goals.length > 0 ? <View className="rounded-3xl bg-surface p-5">
        <Text className="font-ui-bold text-[17px] text-text-main">{t.lexiprogress.activeGoals}</Text>
        {overview.goals.map((goal) => <View key={goal.id} className="mt-4">
          <View className="flex-row justify-between"><Text className="font-ui-semibold text-[14px] text-text-main">{goal.title}</Text><Text className="font-ui-bold text-[13px] text-primary">{goal.percent == null ? t.lexiprogress.noData : `${goal.percent}%`}</Text></View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-surface-alt"><View className="h-full rounded-full bg-primary" style={{ width: `${goal.percent ?? 0}%` }} /></View>
          <Text className="mt-1 font-ui-medium text-[12px] text-text-muted">{goal.actual == null ? t.lexiprogress.notMeasured : `${goal.actual} ${goal.unit}`} / {goal.target_value} {goal.unit}</Text>
        </View>)}
      </View> : null}
      <Text className="mt-5 px-2 text-center font-ui-medium text-[12px] leading-5 text-text-muted">{t.lexiprogress.limitation}</Text>
    </>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <View className="flex-1 rounded-3xl bg-surface p-4" style={{ gap: 8 }}>{icon}<Text className="font-ui-bold text-[23px] text-text-main">{value}</Text><Text className="font-ui-medium text-[12px] text-text-muted">{label}</Text></View>; }
function Metric({ label, value }: { label: string; value: string }) { return <View className="flex-1"><View className="flex-row items-center" style={{ gap: 4 }}><Clock3 size={13} color="#888" /><Text className="font-ui-medium text-[11px] text-text-muted">{label}</Text></View><Text className="mt-1 font-ui-bold text-[14px] text-text-main">{value}</Text></View>; }
function Message({ text }: { text: string }) { return <View className="rounded-3xl bg-surface p-5"><Text className="font-ui-medium text-[14px] text-text-muted">{text}</Text></View>; }
