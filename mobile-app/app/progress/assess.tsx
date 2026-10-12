import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Plus, Trash2 } from 'lucide-react-native';

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

type DraftQuestion = {
  question: string;
  options: string[];
  correct: number | null;
};

const emptyQuestion = (): DraftQuestion => ({ question: '', options: ['', ''], correct: null });

/**
 * Layar penilaian sesi.
 *
 * Kuisnya ditulis MANUAL, bukan dibuat AI: pertanyaan pemahaman harus benar-
 * benar didukung isi teks, dan untuk evaluasi formal spesifikasinya meminta
 * soal yang ditinjau manusia. Karena itu seluruh isi soal disimpan apa adanya
 * dan skornya dihitung server dari jawaban yang benar-benar dipilih. Bila kuis
 * dilewati, skor pemahaman tetap "Belum diukur".
 */
export default function ProgressAssessScreen() {
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
    durationSeconds: string;
  }>();

  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };

  const setOption = (index: number, optionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== index) return q;
        const options = q.options.map((o, oi) => (oi === optionIndex ? value : o));
        return { ...q, options };
      }),
    );
  };

  const addOption = (index: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, options: [...q.options, ''] } : q)),
    );
  };

  const submit = async (skipQuiz: boolean) => {
    setSaving(true);

    const quiz: progressApi.QuizItem[] = skipQuiz
      ? []
      : questions
          .filter((q) => q.question.trim() && q.correct !== null)
          .map((q) => ({
            question: q.question.trim(),
            options: q.options.map((o) => o.trim()).filter(Boolean),
            correct_option: q.correct as number,
            chosen_option: null,
          }));

    try {
      await progressApi.completeSession(Number(params.sessionId), {
        durationSeconds: Number(params.durationSeconds ?? 1),
        difficultyRating: difficulty,
        notes: notes.trim() ? notes.trim() : null,
        quiz: skipQuiz ? undefined : quiz,
        ...(skipQuiz ? { assessmentMethod: 'self_report' } : {}),
      });

      router.replace({
        pathname: '/progress/result',
        params: {
          sessionId: params.sessionId,
          groupId: params.groupId,
          condition: params.condition,
        },
      });
    } catch {
      Alert.alert(t.lexiprogress.assessmentTitle, t.lexiprogress.saveSessionFailed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ScreenBackdrop />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <ProgressScreen title={t.lexiprogress.assessmentTitle} />

        {/* ── Rating kesulitan ─────────────────────────────────────────── */}
        <ProgressCard className="mb-3">
          <ProgressLabel>{t.lexiprogress.difficultyTitle}</ProgressLabel>
          <Text className="mt-2 font-ui-medium text-[12px] leading-5 text-text-muted">
            {t.lexiprogress.difficultyHint}
          </Text>
          <View className="mt-3 flex-row" style={{ gap: 6 }}>
            {t.lexiprogress.difficultyScale.map((label, index) => (
              <View key={label} style={{ flex: 1 }}>
                <ChoiceChip
                  label={String(index + 1)}
                  accessibilityLabel={`${label}. ${index + 1}/5`}
                  selected={difficulty === index + 1}
                  onPress={() => setDifficulty(index + 1)}
                />
                <Text className="mt-1 text-center font-ui-medium text-[9px] text-text-muted" numberOfLines={1}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </ProgressCard>

        {/* ── Kuis pemahaman ───────────────────────────────────────────── */}
        <ProgressCard className="mb-3">
          <ProgressLabel>{t.lexiprogress.comprehensionTitle}</ProgressLabel>
          <Text className="mt-2 font-ui-medium text-[12px] leading-5 text-text-muted">
            {t.lexiprogress.comprehensionHint}
          </Text>

          {questions.map((q, index) => (
            <View key={index} className="mt-4 rounded-2xl border border-border/15 bg-background p-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-ui-bold text-[12px] text-text-muted">
                  {t.lexiprogress.questionLabel(index + 1)}
                </Text>
                {questions.length > 1 ? (
                  <PressableScale
                    silent
                    onPress={() => setQuestions((prev) => prev.filter((_, i) => i !== index))}
                    accessibilityRole="button"
                    accessibilityLabel={t.lexiprogress.removeQuestion}
                    scaleTo={0.9}
                    className="h-8 w-8 items-center justify-center rounded-full bg-surface">
                    <Trash2 size={15} color={colors.textMuted} />
                  </PressableScale>
                ) : null}
              </View>

              <TextInput
                value={q.question}
                onChangeText={(value) => update(index, { question: value })}
                placeholder={t.lexiprogress.chooseTextPlaceholder}
                placeholderTextColor={colors.textMuted}
                className="mt-2 rounded-xl border border-border/15 bg-surface px-3 py-2.5 font-ui text-[14px] text-text-main"
              />

              <Text className="mt-3 font-ui-medium text-[11px] text-text-muted">
                {t.lexiprogress.optionsLabel}
              </Text>
              {q.options.map((option, optionIndex) => (
                <View key={optionIndex} className="mt-2 flex-row items-center" style={{ gap: 8 }}>
                  <PressableScale
                    onPress={() => update(index, { correct: optionIndex })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: q.correct === optionIndex }}
                    accessibilityLabel={t.lexiprogress.chooseCorrect}
                    scaleTo={0.9}
                    className={`h-9 w-9 items-center justify-center rounded-full border ${
                      q.correct === optionIndex ? 'border-primary bg-primary' : 'border-border/25 bg-surface'
                    }`}>
                    {q.correct === optionIndex ? <Check size={15} color="#ffffff" /> : null}
                  </PressableScale>
                  <TextInput
                    value={option}
                    onChangeText={(value) => setOption(index, optionIndex, value)}
                    placeholder={`${t.lexiprogress.optionsLabel} ${optionIndex + 1}`}
                    placeholderTextColor={colors.textMuted}
                    className="flex-1 rounded-xl border border-border/15 bg-surface px-3 py-2.5 font-ui text-[14px] text-text-main"
                  />
                </View>
              ))}

              {q.options.length < 6 ? (
                <PressableScale
                  onPress={() => addOption(index)}
                  accessibilityRole="button"
                  accessibilityLabel={t.lexiprogress.addOption}
                  scaleTo={0.96}
                  className="mt-2 flex-row items-center justify-center rounded-xl bg-primary/[0.07] py-2"
                  style={{ gap: 6 }}>
                  <Plus size={14} color={colors.primary} />
                  <Text className="font-ui-semibold text-[12px] text-primary">
                    {t.lexiprogress.addOption}
                  </Text>
                </PressableScale>
              ) : null}
            </View>
          ))}

          {questions.length < 5 ? (
            <PressableScale
              onPress={() => setQuestions((prev) => [...prev, emptyQuestion()])}
              accessibilityRole="button"
              accessibilityLabel={t.lexiprogress.addQuestion}
              scaleTo={0.97}
              className="mt-3 flex-row items-center justify-center rounded-2xl bg-primary/[0.08] py-3"
              style={{ gap: 6 }}>
              <Plus size={15} color={colors.primary} />
              <Text className="font-ui-bold text-[13px] text-primary">
                {t.lexiprogress.addQuestion}
              </Text>
            </PressableScale>
          ) : null}
        </ProgressCard>

        {/* ── Catatan ──────────────────────────────────────────────────── */}
        <ProgressCard className="mb-4">
          <ProgressLabel>{t.lexiprogress.notesTitle}</ProgressLabel>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={t.lexiprogress.notesPlaceholder}
            placeholderTextColor={colors.textMuted}
            className="mt-3 min-h-[80px] rounded-2xl border border-border/15 bg-background p-3 font-ui text-[14px] text-text-main"
            textAlignVertical="top"
          />
        </ProgressCard>

        <View style={{ gap: 8 }}>
          <ProgressButton
            label={saving ? '…' : t.lexiprogress.saveSession}
            onPress={() => submit(false)}
            disabled={saving}
          />
          <ProgressButton
            label={t.lexiprogress.skipQuiz}
            tone="soft"
            onPress={() => submit(true)}
            disabled={saving}
          />
        </View>
        <Text className="mt-3 px-1 text-center font-ui-medium text-[12px] leading-5 text-text-muted">
          {t.lexiprogress.skippedNote}
        </Text>
      </ScrollView>
    </View>
  );
}
