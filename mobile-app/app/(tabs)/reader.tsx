import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, type TextLayoutLine } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Focus,
  Lightbulb,
  Palette,
  Ruler,
  Sparkles,
  Type,
} from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { GRADIENTS, getTypeLevel } from '../../src/theme/palettes';
import {
  DOC_SECTION,
  DOC_TITLE,
  SIMPLIFY_LEVELS,
  type SimplifyLevelId,
} from '../../src/data/sample-document';
import { simplifyText, AiApiError } from '../../src/api/ai';
import { DyslexicText } from '../../src/components/dyslexic-text';
import { TypographySheet } from '../../src/components/typography-sheet';
import { ExplainSheet, type ExplainTarget } from '../../src/components/explain-sheet';
import { WordSheet } from '../../src/components/word-sheet';
import { Blob, Ring, Sparkle } from '../../src/components/figma-decor';

export default function ReaderScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const {
    rawText,
    typeLevelId,
    simplifyLevel,
    setSimplifyLevel,
    aiParagraphs,
    setAiParagraphs,
    focusMode,
    toggleFocusMode,
    rulerMode,
    toggleRulerMode,
    bicolorMode,
    toggleBicolorMode,
    activeParagraphIndex,
    setActiveParagraphIndex,
  } = useOCRStore();

  const [typographyOpen, setTypographyOpen] = useState(false);
  const [explainTarget, setExplainTarget] = useState<ExplainTarget | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [rulerLine, setRulerLine] = useState(0);
  const [lines, setLines] = useState<TextLayoutLine[]>([]);
  const [simplifyLoading, setSimplifyLoading] = useState(false);
  const [simplifyError, setSimplifyError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const paragraphPositions = useRef<{ [key: number]: number }>({});

  const typeLevel = getTypeLevel(typeLevelId);

  /**
   * Teks pindaian: L1 adalah hasil OCR apa adanya; L2–L5 diminta ke backend
   * (POST /api/simplify-text) dan di-cache per level di store.
   */
  const isScanned = rawText.trim().length > 0;

  const textToSimplify = isScanned
    ? rawText
    : DOC_SECTION + '\n\n' + SIMPLIFY_LEVELS[0].paragraphs.join('\n\n');

  const scannedParagraphs = useMemo(
    () =>
      textToSimplify
        .split(/\n{2,}|\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [textToSimplify],
  );

  const needsAi = simplifyLevel !== 'L1';
  const aiResult = needsAi ? aiParagraphs[simplifyLevel] : undefined;

  const fetchSimplified = useCallback(() => {
    if (simplifyLevel === 'L1') return;
    setSimplifyLoading(true);
    setSimplifyError(null);

    const requestedLevel = simplifyLevel;
    simplifyText(textToSimplify, requestedLevel)
      .then((result) => setAiParagraphs(requestedLevel, result))
      .catch((e) =>
        setSimplifyError(e instanceof AiApiError ? e.message : 'Terjadi kesalahan tak terduga.'),
      )
      .finally(() => setSimplifyLoading(false));
  }, [textToSimplify, simplifyLevel, setAiParagraphs]);

  useEffect(() => {
    if (needsAi && !aiResult) fetchSimplified();
  }, [needsAi, aiResult, fetchSimplified]);

  const paragraphs = useMemo(() => {
    if (simplifyLevel === 'L1') return scannedParagraphs;
    return aiResult ?? scannedParagraphs;
  }, [simplifyLevel, aiResult, scannedParagraphs]);

  const activeIndex = Math.min(activeParagraphIndex, Math.max(0, paragraphs.length - 1));
  const shownParagraphs = paragraphs.length > 0 ? paragraphs : ['Belum ada teks untuk dibaca.'];

  const moveParagraph = (delta: number) => {
    const next = Math.min(shownParagraphs.length - 1, Math.max(0, activeIndex + delta));
    setActiveParagraphIndex(next);
    setRulerLine(0);
    setLines([]);

    setTimeout(() => {
      const yPosition = paragraphPositions.current[next];
      if (yPosition !== undefined && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: Math.max(0, yPosition - 30), animated: true });
      }
    }, 100);
  };

  const moveRuler = (delta: number) => {
    const maxLine = Math.max(0, lines.length - 1);
    setRulerLine((current) => Math.min(maxLine, Math.max(0, current + delta)));
  };

  /**
   * onTextLayout bisa terpanggil lagi setiap render, dan array `lines` selalu
   * objek baru — tanpa pembanding ini state-nya berubah terus dan memicu
   * render berulang tanpa henti.
   */
  const syncLines = (next: TextLayoutLine[]) => {
    setLines((current) => {
      const unchanged =
        current.length === next.length &&
        current.every((line, i) => line.y === next[i].y && line.height === next[i].height);
      return unchanged ? current : next;
    });
  };

  return (
    <>
      <View className="flex-1 bg-background">
        {/* ── Header dokumen ────────────────────────────────────────────── */}
        <LinearGradient
          colors={[...GRADIENTS.readerHeader.colors]}
          locations={[...GRADIENTS.readerHeader.locations]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 8, overflow: 'hidden' }}>
          <Blob size={90} opacity={0.06} style={{ position: 'absolute', top: -22, right: 12 }} />
          <Ring size={70} style={{ position: 'absolute', top: 6, right: -10 }} />
          <Sparkle size={7} style={{ position: 'absolute', top: 18, right: 96 }} />
          <Sparkle size={4} style={{ position: 'absolute', bottom: 20, right: 140 }} />

          <View className="flex-row items-center p-4" style={{ gap: 12 }}>
            <View className="flex-1">
              <View className="flex-row">
                <View
                  className="flex-row items-center rounded-[14px] border border-white/[0.15] bg-white/10 px-2.5 py-1"
                  style={{ gap: 6 }}>
                  <BookOpen size={10} color="#ffffff" />
                  <Text className="font-ui-bold text-[9.5px] text-white">SEDANG DIBACA</Text>
                </View>
              </View>
              <Text className="mt-1.5 font-ui-bold text-[15px] text-white" numberOfLines={1}>
                {isScanned ? 'Hasil Pindaian' : DOC_TITLE}
              </Text>
            </View>

            <Pressable
              onPress={() => setTypographyOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Ubah tipografi"
              className="h-9 flex-row items-center rounded-[14px] border border-white/20 bg-white/[0.14] px-3"
              style={{ gap: 6 }}>
              <Type size={13} color="#ffffff" />
              <Text className="font-ui-bold text-xs text-white">{typeLevel.name}</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Bilah kontrol ─────────────────────────────────────────────── */}
        <View
          className="border-b bg-surface/60 px-4 py-2.5"
          style={{ borderBottomColor: colors.border }}>
          {/* Level penyederhanaan */}
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <View
              className="h-[29px] flex-row items-center rounded-[14px] border border-primary/20 bg-primary/[0.12] px-2.5"
              style={{ gap: 6 }}>
              <Sparkles size={11} color={colors.primary} />
              <Text className="font-ui-bold text-[10px] text-primary">AI</Text>
            </View>

            <View className="h-9 flex-1 flex-row rounded-[14px] bg-primary/[0.06] p-1" style={{ gap: 4 }}>
              {SIMPLIFY_LEVELS.map((item) => {
                const selected = item.id === simplifyLevel;

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSimplifyLevel(item.id as SimplifyLevelId)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Level ${item.id}: ${item.name}`}
                    className="flex-1">
                    {selected ? (
                      <LinearGradient
                        colors={[...GRADIENTS.activePill.colors]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          flex: 1,
                          borderRadius: 10,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Text className="font-ui-bold text-xs text-white">{item.id}</Text>
                      </LinearGradient>
                    ) : (
                      <View className="flex-1 items-center justify-center rounded-[10px]">
                        <Text className="font-ui-bold text-xs text-text-muted">{item.id}</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sakelar fitur baca + navigasi paragraf */}
          <View className="mt-2.5 flex-row items-center" style={{ gap: 6 }}>
            <FeatureChip
              active={focusMode}
              onPress={toggleFocusMode}
              icon={<Focus size={12} color={focusMode ? '#ffffff' : colors.textMuted} />}
              label="Fokus"
            />
            <FeatureChip
              active={rulerMode}
              onPress={toggleRulerMode}
              icon={<Ruler size={12} color={rulerMode ? '#ffffff' : colors.textMuted} />}
              label="Penggaris"
            />
            <FeatureChip
              active={bicolorMode}
              onPress={toggleBicolorMode}
              icon={<Palette size={12} color={bicolorMode ? '#ffffff' : colors.textMuted} />}
              label="Bicolor"
            />

            <View className="ml-auto flex-row items-center" style={{ gap: 4 }}>
              <Pressable
                onPress={() => moveParagraph(-1)}
                disabled={activeIndex === 0}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Paragraf sebelumnya"
                className="h-8 w-8 items-center justify-center rounded-[14px] bg-primary/[0.07] disabled:opacity-40">
                <ChevronUp size={13} color={colors.primary} />
              </Pressable>
              <Text className="font-ui-bold text-[10px] text-text-muted">
                {activeIndex + 1}/{shownParagraphs.length}
              </Text>
              <Pressable
                onPress={() => moveParagraph(1)}
                disabled={activeIndex >= shownParagraphs.length - 1}
                hitSlop={6}
                accessibilityRole="button"
                accessibilityLabel="Paragraf berikutnya"
                className="h-8 w-8 items-center justify-center rounded-[14px] bg-primary/[0.07] disabled:opacity-40">
                <ChevronDown size={13} color={colors.primary} />
              </Pressable>
            </View>
          </View>

          {needsAi && simplifyLoading ? (
            <Text className="mt-2 font-ui text-[10px] text-primary">
              Lexi sedang menyederhanakan teksnya… sementara ini teks asli dulu.
            </Text>
          ) : null}
          {needsAi && !simplifyLoading && simplifyError ? (
            <Pressable onPress={fetchSimplified} accessibilityRole="button" hitSlop={6}>
              <Text className="mt-2 font-ui text-[10px] text-text-muted">
                {simplifyError}{' '}
                <Text className="font-ui-bold text-primary">Ketuk untuk coba lagi.</Text>
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* ── Isi bacaan ────────────────────────────────────────────────── */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* Judul bagian dokumen */}
          <View
            className="flex-row items-center rounded-[14px] bg-primary/[0.06] px-3 py-2"
            style={{ gap: 8 }}>
            <LinearGradient
              colors={[...GRADIENTS.activePill.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ width: 4, height: 40, borderRadius: 2 }}
            />
            <Text className="flex-1 font-read-bold text-[13px] leading-5 text-text-main">
              {isScanned ? 'Teks hasil pindaian' : 'Mitokondria — Pembangkit Energi Sel'}
            </Text>
          </View>

          {shownParagraphs.map((paragraph, index) => {
            const isActive = index === activeIndex;
            const dimmed = focusMode && !isActive;
            const showRuler = rulerMode && isActive && lines.length > 0;
            const rulerTarget = lines[Math.min(rulerLine, lines.length - 1)];

            return (
              <View
                key={index}
                onLayout={(event) => {
                  paragraphPositions.current[index] = event.nativeEvent.layout.y;
                }}
                className={
                  isActive
                    ? 'mt-4 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4'
                    : 'mt-6'
                }>
                {/*
                  Mode Fokus meredupkan paragraf lain, bukan menyembunyikannya —
                  pembaca tetap bisa melihat konteks di sekitarnya.
                */}
                {isActive ? (
                  <Text className="mb-2.5 font-ui-bold text-[10px] text-primary">
                    PARAGRAF {index + 1} DARI {shownParagraphs.length}
                  </Text>
                ) : null}

                <View className="relative">
                  {showRuler && rulerTarget ? (
                    <View
                      pointerEvents="none"
                      className="absolute left-0 right-0 rounded-md bg-highlight"
                      style={{ top: rulerTarget.y, height: rulerTarget.height }}
                    />
                  ) : null}
                  <DyslexicText
                    bicolor={bicolorMode}
                    dimmed={dimmed}
                    onWordPress={dimmed ? undefined : setSelectedWord}
                    onTextLayout={
                      rulerMode && isActive
                        ? (event) => syncLines(event.nativeEvent.lines)
                        : undefined
                    }>
                    {paragraph}
                  </DyslexicText>
                </View>

                {showRuler ? (
                  <View className="mt-3 flex-row items-center" style={{ gap: 6 }}>
                    <Pressable
                      onPress={() => moveRuler(-1)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Penggaris naik satu baris"
                      className="h-7 w-7 items-center justify-center rounded-[10px] bg-primary/[0.07]">
                      <ChevronUp size={13} color={colors.primary} />
                    </Pressable>
                    <Pressable
                      onPress={() => moveRuler(1)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Penggaris turun satu baris"
                      className="h-7 w-7 items-center justify-center rounded-[10px] bg-primary/[0.07]">
                      <ChevronDown size={13} color={colors.primary} />
                    </Pressable>
                    <Text className="font-ui text-[10px] text-text-muted">
                      Baris {Math.min(rulerLine, lines.length - 1) + 1} dari {lines.length}
                    </Text>
                  </View>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {/* ── Aksi bawah ────────────────────────────────────────────────── */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', colors.background]}
          locations={[0, 0.45]}
          style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 }}>
          <Pressable
            onPress={() =>
              setExplainTarget({
                term: shownParagraphs[activeIndex],
                context: shownParagraphs[activeIndex],
                // Dokumen contoh punya jawaban kurasi; teks pindaian dijelaskan AI beneran.
                useStaticAnswers: !isScanned,
              })
            }
            accessibilityRole="button">
            <LinearGradient
              colors={['rgba(124,58,237,0.12)', 'rgba(79,70,229,0.12)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 53,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(124,58,237,0.2)',
              }}>
              <Lightbulb size={17} color={colors.primary} />
              <Text className="font-ui-bold text-[15px] text-primary">Jelaskan Teks Ini</Text>
            </LinearGradient>
          </Pressable>

          <View
            className="mt-3 h-[37px] flex-row items-center justify-center rounded-[14px] bg-primary/[0.04]"
            style={{ gap: 8 }}>
            <Lightbulb size={13} color={colors.textMuted} />
            <Text className="font-ui text-[11px] text-text-muted">
              Ketuk kata untuk melihat suku kata
            </Text>
          </View>
        </LinearGradient>
      </View>

      <TypographySheet visible={typographyOpen} onClose={() => setTypographyOpen(false)} />
      <ExplainSheet target={explainTarget} onClose={() => setExplainTarget(null)} />
      <WordSheet
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
        onExplain={(word) => {
          setSelectedWord(null);
          setExplainTarget({ term: word, context: shownParagraphs[activeIndex] });
        }}
      />
    </>
  );
}

/** Chip sakelar fitur baca — aktif jadi pil gradien, mati jadi ungu 7%. */
function FeatureChip({
  active,
  onPress,
  icon,
  label,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  const content = (
    <>
      {icon}
      <Text className={`font-ui-bold text-[11px] ${active ? 'text-white' : 'text-text-muted'}`}>
        {label}
      </Text>
    </>
  );

  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: active }}>
      {active ? (
        <LinearGradient
          colors={[...GRADIENTS.activePill.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 29,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            borderRadius: 14,
          }}>
          {content}
        </LinearGradient>
      ) : (
        <View
          className="h-[29px] flex-row items-center rounded-[14px] bg-primary/[0.07] px-2.5"
          style={{ gap: 4 }}>
          {content}
        </View>
      )}
    </Pressable>
  );
}
