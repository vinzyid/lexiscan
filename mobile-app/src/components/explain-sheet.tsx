import { useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowLeft, ChevronRight, MessageSquare, Lightbulb, UserRound } from 'lucide-react-native';

import { explainTerm, AiApiError } from '../api/ai';
import { EXPLAIN_STYLES, getExplainStyle, type ExplainStyleId } from '../data/sample-document';
import { useThemeColors } from '../theme/theme-provider';
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
  const [styleId, setStyleId] = useState<ExplainStyleId | null>(null);
  const [paragraphs, setParagraphs] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = styleId ? getExplainStyle(styleId) : null;

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
      setParagraphs(getExplainStyle(id).answer);
      return;
    }

    setLoading(true);
    setParagraphs(null);
    try {
      setParagraphs(await explainTerm(target.term, id, target.context));
    } catch (e) {
      setError(e instanceof AiApiError ? e.message : 'Terjadi kesalahan tak terduga. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to map emoji to Lucide Icon
  const renderStyleIcon = (id: string, size = 24, color = colors.textMain) => {
    if (id === 'anak10') return <UserRound size={size} color={color} />;
    if (id === 'analogi') return <MessageSquare size={size} color={color} />;
    if (id === 'nyata') return <Lightbulb size={size} color={color} />;
    return <Text className="text-2xl">{getExplainStyle(id as ExplainStyleId)?.emoji}</Text>;
  };

  return (
    <Modal visible={!!target} animationType="slide" onRequestClose={close}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center border-b border-border/10 px-4 pb-4 pt-14">
          <Pressable
            onPress={() => (active ? reset() : close())}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={active ? 'Kembali ke pilihan gaya' : 'Tutup'}
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-surface-alt">
            <ArrowLeft size={16} color={colors.textMuted} />
          </Pressable>
          <View className="flex-1">
            <Text className="font-ui-bold text-base text-text-main">AI Explain This</Text>
            <Text className="font-ui text-[10px] text-text-muted" numberOfLines={1}>
              {active ? 'Penjelasan dari Lexi' : `Tentang: ${target?.term ?? ''}`}
            </Text>
          </View>
        </View>

        {active ? (
          <ScrollView className="flex-1 px-4 pt-5" contentContainerClassName="pb-10">
            <View className="mb-4 flex-row items-center self-start rounded-full bg-primary/10 px-4 py-2">
              <View className="mr-2">
                {renderStyleIcon(active.id, 14, colors.primary)}
              </View>
              <Text className="font-ui-bold text-[11px] text-primary">
                {active.name}
              </Text>
            </View>

            <View className="flex-row">
              <View className="mr-3 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                <LexiMascot size={34} />
              </View>
              <View className="flex-1 rounded-3xl rounded-tl-lg border border-border/10 bg-surface p-4">
                {loading ? (
                  <View className="flex-row items-center py-1">
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text className="ml-3 font-ui text-xs text-text-muted">
                      Lexi sedang berpikir…
                    </Text>
                  </View>
                ) : error ? (
                  <>
                    <Text className="mb-3 font-ui text-xs leading-6 text-text-main">
                      Aduh, aku belum bisa menjawab. {error}
                    </Text>
                    <Pressable
                      onPress={() => ask(active.id)}
                      accessibilityRole="button"
                      className="self-start rounded-xl bg-primary/10 px-4 py-2">
                      <Text className="font-ui-bold text-xs text-primary">🔄 Coba Lagi</Text>
                    </Pressable>
                  </>
                ) : (
                  (paragraphs ?? []).map((para, index, all) => (
                    <Text
                      key={index}
                      className={`font-ui text-xs leading-6 text-text-main ${
                        index < all.length - 1 ? 'mb-4' : ''
                      }`}>
                      {para}
                    </Text>
                  ))
                )}
              </View>
            </View>

            <Pressable
              onPress={reset}
              accessibilityRole="button"
              className="mt-6 rounded-2xl bg-primary/10 py-3.5">
              <Text className="text-center font-ui-bold text-xs text-primary">
                ← Coba Gaya Lain
              </Text>
            </Pressable>

            <View className="mt-3 flex-row justify-center">
              {EXPLAIN_STYLES.filter((s) => s.id !== active.id).map((s) => (
                <Pressable key={s.id} onPress={() => ask(s.id)} hitSlop={6} className="mx-2 flex-row items-center">
                  {renderStyleIcon(s.id, 12, colors.textMuted)}
                  <Text className="ml-1 font-ui text-[10px] text-text-muted">
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        ) : (
          <ScrollView className="flex-1 px-5 pt-8" contentContainerClassName="pb-10">
            <View className="mb-8 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                <LexiMascot size={72} />
              </View>
              <Text className="font-ui-bold text-sm text-text-main">
                Mau Lexi jelasin gimana?
              </Text>
            </View>

            {EXPLAIN_STYLES.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => ask(s.id)}
                accessibilityRole="button"
                className="mb-3 flex-row items-center rounded-3xl border border-border/10 bg-surface p-4">
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {renderStyleIcon(s.id, 22, colors.primary)}
                </View>
                <View className="flex-1">
                  <Text className="mb-0.5 font-ui-bold text-xs text-text-main">{s.name}</Text>
                  <Text className="font-ui text-[10px] text-primary">{s.desc}</Text>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
