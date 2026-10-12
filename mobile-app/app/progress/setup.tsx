import { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import * as progressApi from '../../src/api/lexiprogress';
import { useT } from '../../src/i18n';
import { useOCRStore } from '../../src/store/useStore';
import { randomUuid } from '../../src/utils/uuid';
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

/** Fitur bantuan yang bisa dicatat sebagai aktif pada sebuah sesi. */
const FEATURE_KEYS: (keyof ReturnType<typeof useT>['lexiprogress']['featureNames'])[] = [
  'typography',
  'simplify',
  'focus',
  'ruler',
  'bicolor',
  'syllables',
  'speech',
  'explain',
];

export default function ProgressSetupScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const t = useT();

  const rawText = useOCRStore((s) => s.rawText);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [condition, setCondition] = useState<progressApi.ProgressCondition>('baseline');
  const [features, setFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const useSample = () => {
    setText(t.sampleDoc.paragraphs.join('\n\n'));
    if (!title.trim()) setTitle(t.sampleDoc.title);
  };

  const useScan = () => {
    if (!rawText.trim()) return;
    setText(rawText);
    if (!title.trim()) setTitle(t.reader.scanResult);
  };

  const toggleFeature = (key: string) => {
    setFeatures((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));
  };

  const begin = async () => {
    if (!text.trim()) {
      Alert.alert(t.lexiprogress.setupTitle, t.lexiprogress.needText);
      return;
    }
    if (!title.trim()) {
      Alert.alert(t.lexiprogress.setupTitle, t.lexiprogress.needTitle);
      return;
    }

    setSaving(true);
    try {
      const { document } = await progressApi.createDocument({
        title: title.trim(),
        textSnapshot: text,
        sourceType: rawText.trim() && text === rawText ? 'scan' : 'text',
      });

      /*
       * Grup sesi menyatukan baseline dan berbantuan atas teks yang sama. Dibuat
       * acak di perangkat, lalu dipakai ulang oleh kondisi pasangannya nanti.
       */
      const sessionGroupId = randomUuid();

      const { session } = await progressApi.createSession({
        documentId: document.id,
        condition,
        sessionGroupId,
        features,
      });

      router.replace({
        pathname: '/progress/read',
        params: {
          sessionId: String(session.id),
          documentId: String(document.id),
          groupId: sessionGroupId,
          condition,
          title: document.title,
          text,
        },
      });
    } catch {
      Alert.alert(t.lexiprogress.setupTitle, t.lexiprogress.saveDocumentFailed);
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
        <ProgressScreen title={t.lexiprogress.setupTitle} subtitle={t.lexiprogress.setupSubtitle} />

        {/* ── Teks yang dibaca ─────────────────────────────────────────── */}
        <ProgressCard className="mb-3">
          <ProgressLabel>{t.lexiprogress.chooseText}</ProgressLabel>
          <View className="mt-3 flex-row" style={{ gap: 8 }}>
            <PressableScale
              onPress={useSample}
              accessibilityRole="button"
              accessibilityLabel={t.lexiprogress.useSampleText}
              scaleTo={0.96}
              className="flex-1 rounded-2xl bg-primary/[0.08] py-2.5">
              <Text className="text-center font-ui-bold text-[13px] text-primary">
                {t.lexiprogress.useSampleText}
              </Text>
            </PressableScale>
            {rawText.trim() ? (
              <PressableScale
                onPress={useScan}
                accessibilityRole="button"
                accessibilityLabel={t.reader.scanResult}
                scaleTo={0.96}
                className="flex-1 rounded-2xl bg-primary/[0.08] py-2.5">
                <Text className="text-center font-ui-bold text-[13px] text-primary">
                  {t.reader.scanResult}
                </Text>
              </PressableScale>
            ) : null}
          </View>

          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder={t.lexiprogress.chooseTextPlaceholder}
            placeholderTextColor={colors.textMuted}
            className="mt-3 min-h-[120px] rounded-2xl border border-border/15 bg-background p-3 font-read text-[15px] leading-7 text-text-main"
            textAlignVertical="top"
          />
        </ProgressCard>

        {/* ── Judul teks ───────────────────────────────────────────────── */}
        <ProgressCard className="mb-3">
          <ProgressLabel>{t.lexiprogress.titleLabel}</ProgressLabel>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t.lexiprogress.titlePlaceholder}
            placeholderTextColor={colors.textMuted}
            className="mt-3 rounded-2xl border border-border/15 bg-background px-3 py-3 font-ui text-[15px] text-text-main"
          />
        </ProgressCard>

        {/* ── Kondisi sesi ─────────────────────────────────────────────── */}
        <ProgressCard className="mb-3">
          <ProgressLabel>{t.lexiprogress.conditionLabel}</ProgressLabel>
          <Text className="mt-2 font-ui-medium text-[12px] leading-5 text-text-muted">
            {t.lexiprogress.conditionHint}
          </Text>
          <View className="mt-3 flex-row" style={{ gap: 8 }}>
            <View style={{ flex: 1 }}>
              <ChoiceChip
                label={t.lexiprogress.baseline}
                selected={condition === 'baseline'}
                onPress={() => setCondition('baseline')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <ChoiceChip
                label={t.lexiprogress.assisted}
                selected={condition === 'assisted'}
                onPress={() => setCondition('assisted')}
              />
            </View>
          </View>
          <Text className="mt-2 font-ui-medium text-[12px] leading-5 text-text-muted">
            {condition === 'baseline' ? t.lexiprogress.baselineNote : t.lexiprogress.assistedNote}
          </Text>
        </ProgressCard>

        {/* ── Fitur aktif ──────────────────────────────────────────────── */}
        <ProgressCard className="mb-4">
          <ProgressLabel>{t.lexiprogress.featureLabel}</ProgressLabel>
          <Text className="mt-2 font-ui-medium text-[12px] leading-5 text-text-muted">
            {t.lexiprogress.featureHint}
          </Text>
          <View className="mt-3 flex-row flex-wrap" style={{ gap: 8 }}>
            {FEATURE_KEYS.map((key) => (
              <View key={key} style={{ width: '48%' }}>
                <ChoiceChip
                  label={t.lexiprogress.featureNames[key]}
                  selected={features.includes(key)}
                  onPress={() => toggleFeature(key)}
                />
              </View>
            ))}
          </View>
        </ProgressCard>

        <Text className="mb-4 px-1 font-ui-medium text-[12px] leading-5 text-text-muted">
          {t.lexiprogress.sameGroupHint}
        </Text>

        <ProgressButton
          label={saving ? '…' : t.lexiprogress.startReading}
          onPress={begin}
          disabled={saving}
        />
      </ScrollView>
    </View>
  );
}
