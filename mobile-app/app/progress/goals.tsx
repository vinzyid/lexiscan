import { useCallback, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Target, Trash2 } from 'lucide-react-native';

import * as progressApi from '../../src/api/lexiprogress';
import { useT } from '../../src/i18n';
import { useThemeColors } from '../../src/theme/theme-provider';
import { PressableScale } from '../../src/components/pressable-scale';
import { ScreenBackdrop } from '../../src/components/figma-decor';
import {
  ChoiceChip,
  ProgressButton,
  ProgressCard,
  ProgressLabel,
  ProgressScreen,
} from '../../src/components/progress-kit';

const METRIC_KEYS: progressApi.GoalMetricKey[] = [
  'session_count',
  'comprehension_percent',
  'difficulty_rating',
  'wpm',
  'cwpm',
  'duration_seconds',
  'accuracy_percent',
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Goal belajar: membuat, melihat kemajuan, dan menghapusnya.
 *
 * Progres dihitung server mengikuti arah tiap metrik — kesulitan dan durasi
 * makin rendah makin baik, sisanya makin tinggi makin baik. Karena itu layar ini
 * hanya menampilkan angka yang sudah dihitung, tidak menghitung sendiri.
 */
export default function ProgressGoalsScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const t = useT();

  const [goals, setGoals] = useState<progressApi.ProgressGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [metric, setMetric] = useState<progressApi.GoalMetricKey>('session_count');
  const [baseline, setBaseline] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState(t.lexiprogress.metrics.session_count.unit);
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { goals: loaded } = await progressApi.fetchGoals();
      setGoals(loaded);
    } catch {
      // Diamkan; layar kosong sudah memberi tahu statusnya.
    }
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const chooseMetric = (key: progressApi.GoalMetricKey) => {
    setMetric(key);
    setUnit(t.lexiprogress.metrics[key].unit);
  };

  const save = async () => {
    if (!title.trim() || !target.trim()) {
      Alert.alert(t.lexiprogress.goalFormTitle, t.lexiprogress.needTitle);
      return;
    }

    setSaving(true);
    try {
      await progressApi.createGoal({
        title: title.trim(),
        metricKey: metric,
        baselineValue: baseline.trim() ? Number(baseline) : null,
        targetValue: Number(target),
        unit: unit.trim() || t.lexiprogress.metrics[metric].unit,
        startsAt: todayIso(),
        targetDate: targetDate.trim() ? targetDate.trim() : null,
      });

      setTitle('');
      setBaseline('');
      setTarget('');
      setTargetDate('');
      setShowForm(false);
      await load();
    } catch {
      Alert.alert(t.lexiprogress.goalFormTitle, t.lexiprogress.goalSaveFailed);
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    Alert.alert(t.lexiprogress.goalDelete, t.lexiprogress.goalDelete, [
      { text: t.settings.cancel, style: 'cancel' },
      {
        text: t.lexiprogress.goalDelete,
        style: 'destructive',
        onPress: async () => {
          try {
            await progressApi.deleteGoal(id);
            await load();
          } catch {
            Alert.alert(t.lexiprogress.goalTitle, t.lexiprogress.goalSaveFailed);
          }
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ProgressScreen title={t.lexiprogress.goalTitle} />

        {/* ── Daftar goal ─────────────────────────────────────────────── */}
        {goals.length === 0 ? (
          <ProgressCard className="mb-3">
            <Target size={26} color={colors.primary} />
            <Text className="mt-3 font-ui-medium text-[14px] leading-6 text-text-muted">
              {t.lexiprogress.goalEmpty}
            </Text>
          </ProgressCard>
        ) : (
          goals.map((goal) => (
            <ProgressCard key={goal.id} className="mb-3">
              <View className="flex-row items-start justify-between" style={{ gap: 10 }}>
                <View className="flex-1">
                  <Text className="font-ui-bold text-[15px] text-text-main">{goal.title}</Text>
                  <Text className="mt-1 font-ui-medium text-[12px] text-text-muted">
                    {t.lexiprogress.metrics[goal.metric_key].name}
                  </Text>
                </View>
                <PressableScale
                  silent
                  onPress={() => remove(goal.id)}
                  accessibilityRole="button"
                  accessibilityLabel={t.lexiprogress.goalDelete}
                  scaleTo={0.9}
                  className="h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
                  <Trash2 size={15} color={colors.textMuted} />
                </PressableScale>
              </View>

              <View className="mt-3 h-2 overflow-hidden rounded-full bg-surface-alt">
                <View
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${goal.percent ?? 0}%` }}
                />
              </View>
              <View className="mt-2 flex-row justify-between">
                <Text className="font-ui-semibold text-[12px] text-primary">
                  {goal.percent === null ? t.lexiprogress.notMeasured : `${goal.percent}%`}
                </Text>
                <Text className="font-ui-medium text-[12px] text-text-muted">
                  {goal.actual === null ? t.lexiprogress.notMeasured : `${goal.actual} ${goal.unit}`} /{' '}
                  {goal.target_value} {goal.unit}
                </Text>
              </View>
            </ProgressCard>
          ))
        )}

        {/* ── Form goal baru ──────────────────────────────────────────── */}
        {showForm ? (
          <ProgressCard className="mb-3">
            <ProgressLabel>{t.lexiprogress.goalFormTitle}</ProgressLabel>

            <Text className="mt-3 font-ui-medium text-[12px] text-text-muted">
              {t.lexiprogress.goalNameLabel}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t.lexiprogress.goalNamePlaceholder}
              placeholderTextColor={colors.textMuted}
              className="mt-2 rounded-2xl border border-border/15 bg-background px-3 py-3 font-ui text-[14px] text-text-main"
            />

            <Text className="mt-3 font-ui-medium text-[12px] text-text-muted">
              {t.lexiprogress.goalMetricLabel}
            </Text>
            <View className="mt-2 flex-row flex-wrap" style={{ gap: 8 }}>
              {METRIC_KEYS.map((key) => (
                <View key={key} style={{ width: '48%' }}>
                  <ChoiceChip
                    label={t.lexiprogress.metrics[key].name}
                    selected={metric === key}
                    onPress={() => chooseMetric(key)}
                  />
                </View>
              ))}
            </View>

            <View className="mt-3 flex-row" style={{ gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text className="font-ui-medium text-[12px] text-text-muted">
                  {t.lexiprogress.goalBaselineLabel}
                </Text>
                <TextInput
                  value={baseline}
                  onChangeText={setBaseline}
                  keyboardType="numeric"
                  className="mt-2 rounded-2xl border border-border/15 bg-background px-3 py-3 font-ui text-[14px] text-text-main"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-ui-medium text-[12px] text-text-muted">
                  {t.lexiprogress.goalTargetLabel}
                </Text>
                <TextInput
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="numeric"
                  className="mt-2 rounded-2xl border border-border/15 bg-background px-3 py-3 font-ui text-[14px] text-text-main"
                />
              </View>
            </View>

            <View className="mt-3 flex-row" style={{ gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text className="font-ui-medium text-[12px] text-text-muted">
                  {t.lexiprogress.goalUnitLabel}
                </Text>
                <TextInput
                  value={unit}
                  onChangeText={setUnit}
                  placeholder={t.lexiprogress.goalUnitPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  className="mt-2 rounded-2xl border border-border/15 bg-background px-3 py-3 font-ui text-[14px] text-text-main"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text className="font-ui-medium text-[12px] text-text-muted">
                  {t.lexiprogress.goalDeadlineLabel}
                </Text>
                <TextInput
                  value={targetDate}
                  onChangeText={setTargetDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textMuted}
                  className="mt-2 rounded-2xl border border-border/15 bg-background px-3 py-3 font-ui text-[14px] text-text-main"
                />
              </View>
            </View>
          </ProgressCard>
        ) : null}

        <View style={{ gap: 8 }}>
          <ProgressButton
            label={showForm ? t.lexiprogress.goalSave : t.lexiprogress.newGoal}
            onPress={showForm ? () => void save() : () => setShowForm(true)}
            disabled={saving}
          />
          {showForm ? (
            <ProgressButton label={t.settings.cancel} tone="soft" onPress={() => setShowForm(false)} />
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
