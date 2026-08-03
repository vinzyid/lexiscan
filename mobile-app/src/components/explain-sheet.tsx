import { useState } from 'react';
import { Modal, View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, ChevronRight, MessageSquare, Lightbulb, UserRound } from 'lucide-react-native';

import { explainTerm, AiApiError } from '../api/ai';
import {
  EXPLAIN_STYLE_EMOJI,
  EXPLAIN_STYLE_IDS,
  type ExplainStyleId,
} from '../data/sample-document';
import { useT } from '../i18n';
import { useThemeColors } from '../theme/theme-provider';
import { DyslexicText } from './dyslexic-text';
import { PressableScale } from './pressable-scale';
import { LexiMascot } from './illustrations';

export type ExplainTarget = {
  /** Kata atau potongan teks yang ingin dijelaskan. */
  term: string;
  /** Paragraf tempat term muncul; dikirim ke backend sebagai konteks. */
  context?: string;
  /**
   * Pakai jawaban kurasi lokal, bukan API — untuk dokumen contoh, supaya
   * demo tetap jalan tanpa server dan tanpa kuota.
   */
  useStaticAnswers?: boolean;
};

/**
 * Layar "AI Explain This": pilih gaya penjelasan dulu, lalu Lexi menjawab
 * dalam gelembung chat. Tombol "Coba Gaya Lain" mengembalikan ke pilihan.
 * Jawaban datang dari POST /api/explain-word, kecuali target statis.
 */
export function ExplainSheet({ target, onClose }: { target: ExplainTarget | null; onClose: () => void }) {
  const colors = useThemeColors();
  const t = useT();
  const [styleId, setStyleId] = useState<ExplainStyleId | null>(null);
  const [paragraphs, setParagraphs] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = styleId ? { id: styleId, ...t.explainStyles[styleId] } : null;

  const reset = () => {
    setStyleId(null);
    setParagraphs(null);
    setError(null);
    setLoading(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  const ask = async (id: ExplainStyleId) => {
    if (!target) return;
    setStyleId(id);
    setError(null);

    if (target.useStaticAnswers) {
      setParagraphs(t.explainStyles[id].answer);
      return;
    }

    setLoading(true);
    setParagraphs(null);
    try {
      setParagraphs(await explainTerm(target.term, id, target.context));
    } catch (e) {
      setError(e instanceof AiApiError ? e.message : t.explain.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map emoji to Lucide Icon
  const renderStyleIcon = (id: string, size = 24, color = colors.textMain) => {
    if (id === 'anak10') return <UserRound size={size} color={color} />;
    if (id === 'analogi') return <MessageSquare size={size} color={color} />;
    if (id === 'nyata') return <Lightbulb size={size} color={color} />;
    return <Text className="text-2xl">{EXPLAIN_STYLE_EMOJI[id as ExplainStyleId]}</Text>;
  };

  return (
    <Modal visible={!!target} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center border-b border-border/10 px-4 pb-4 pt-14">
          <PressableScale
            onPress={() => (active ? reset() : close())}
            accessibilityRole="button"
            accessibilityLabel={active ? t.explain.backLabel : t.common.close}
            scaleTo={0.9}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-surface-alt">
            <ArrowLeft size={18} color={colors.textMuted} />
          </PressableScale>
          <View className="flex-1">
            <Text className="font-ui-bold text-[17px] text-text-main">{t.explain.title}</Text>
            <Text className="font-ui-medium text-[13px] text-text-muted" numberOfLines={1}>
              {active ? t.explain.fromLexi : t.explain.about(target?.term ?? '')}
            </Text>
          </View>
        </View>

        {active ? (
          <ScrollView className="flex-1 px-4 pt-5" contentContainerClassName="pb-10">
            <View className="mb-4 flex-row items-center self-start rounded-full bg-primary/10 px-4 py-2">
              <View className="mr-2">
                {renderStyleIcon(active.id, 14, colors.primary)}
              </View>
              <Text className="font-ui-bold text-[13px] text-primary">{active.name}</Text>
            </View>

            <View className="flex-row">
              <View className="mr-3 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                <LexiMascot size={34} />
              </View>
              <View className="flex-1 rounded-3xl rounded-tl-lg border border-border/10 bg-surface p-4">
                {loading ? (
                  <View className="flex-row items-center py-1">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="ml-3 font-ui-medium text-sm text-text-muted">
                      {t.explain.thinking}
                    </Text>
                  </View>
                ) : error ? (
                  <>
                    <Text className="mb-3 font-ui-medium text-sm leading-6 text-text-main">
                      {t.explain.cantAnswer} {error}
                    </Text>
                    <PressableScale
                      onPress={() => ask(active.id)}
                      accessibilityRole="button"
                      accessibilityLabel={t.explain.retryLabel}
                      className="h-11 items-center justify-center self-start rounded-xl bg-primary/10 px-4">
                      <Text className="font-ui-bold text-sm text-primary">🔄 {t.common.tryAgain}</Text>
                    </PressableScale>
                  </>
                ) : (
                  /*
                   * Jawaban Lexi adalah teks yang justru paling perlu dibaca,
                   * jadi ia memakai DyslexicText — font Atkinson, spasi baris,
                   * dan preset ukuran yang sama persis dengan layar Baca.
                   * Sebelumnya bagian ini dirender 12px dengan font antarmuka.
                   */
                  (paragraphs ?? []).map((para, index, all) => (
                    <View key={index} className={index < all.length - 1 ? 'mb-4' : ''}>
                      <DyslexicText>{para}</DyslexicText>
                    </View>
                  ))
                )}
              </View>
            </View>

            <PressableScale
              onPress={reset}
              accessibilityRole="button"
              accessibilityLabel={t.explain.otherStyleLabel}
              scaleTo={0.98}
              className="mt-6 h-12 items-center justify-center rounded-2xl bg-primary/10">
              <Text className="text-center font-ui-bold text-sm text-primary">
                {t.explain.otherStyle}
              </Text>
            </PressableScale>

            <View className="mt-3 flex-row justify-center">
              {EXPLAIN_STYLE_IDS.filter((sid) => sid !== active.id).map((sid) => (
                <PressableScale
                  key={sid}
                  onPress={() => ask(sid)}
                  accessibilityRole="button"
                  accessibilityLabel={t.explain.styleLabel(t.explainStyles[sid].name)}
                  scaleTo={0.94}
                  className="mx-1 h-11 flex-row items-center rounded-xl px-2">
                  {renderStyleIcon(sid, 14, colors.textMuted)}
                  <Text className="ml-1.5 font-ui-medium text-xs text-text-muted">
                    {t.explainStyles[sid].name}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-5 pt-8" contentContainerClassName="pb-10">
            <View className="mb-8 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                <LexiMascot size={72} />
              </View>
              <Text className="font-ui-bold text-[17px] text-text-main">
                {t.explain.chooseStyle}
              </Text>
            </View>

            {EXPLAIN_STYLE_IDS.map((sid) => {
              const style = t.explainStyles[sid];

              return (
                <PressableScale
                  key={sid}
                  onPress={() => ask(sid)}
                  accessibilityRole="button"
                  accessibilityLabel={`${style.name}. ${style.desc}`}
                  scaleTo={0.98}
                  className="mb-3 flex-row items-center rounded-3xl border border-border/10 bg-surface p-4">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {renderStyleIcon(sid, 22, colors.primary)}
                  </View>
                  <View className="flex-1">
                    <Text className="mb-0.5 font-ui-bold text-[15px] text-text-main">
                      {style.name}
                    </Text>
                    <Text className="font-ui-medium text-[13px] text-primary">{style.desc}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </PressableScale>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
