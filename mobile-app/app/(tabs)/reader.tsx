import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { View, Text, ScrollView, Pressable, type TextLayoutLine } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Type,
  Focus,
  Ruler,
  Palette,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Lightbulb,
} from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { getTypeLevel } from '../../src/theme/palettes';
import {
  DOC_SECTION,
  DOC_TITLE,
  SIMPLIFY_LEVELS,
  getSimplifyLevel,
  type SimplifyLevelId,
} from '../../src/data/sample-document';
import { simplifyText, AiApiError } from '../../src/api/ai';
import { DyslexicText } from '../../src/components/dyslexic-text';
import { TypographySheet } from '../../src/components/typography-sheet';
import { ExplainSheet, type ExplainTarget } from '../../src/components/explain-sheet';
import { WordSheet } from '../../src/components/word-sheet';

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
  const level = getSimplifyLevel(simplifyLevel);

  /**
   * Teks pindaian: L1 adalah hasil OCR apa adanya; L2–L5 diminta ke backend
   * (POST /api/simplify-text) dan di-cache per level di store.
   */
  const isScanned = rawText.trim().length > 0;

  // Karena fitur demo ingin kita matikan limitasinya, sekarang L2-L5 juga
  // memanggil API untuk teks statis (teks contoh).
  const textToSimplify = isScanned ? rawText : DOC_SECTION + "\n\n" + SIMPLIFY_LEVELS[0].paragraphs.join("\n\n");

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
    if (simplifyLevel === 'L1') {
        return scannedParagraphs;
    }
    return aiResult ?? scannedParagraphs;
  }, [simplifyLevel, aiResult, scannedParagraphs]);

  const activeIndex = Math.min(activeParagraphIndex, Math.max(0, paragraphs.length - 1));
  const shownParagraphs = paragraphs.length > 0 ? paragraphs : ['Belum ada teks untuk dibaca.'];

  const moveParagraph = (delta: number) => {
    const next = Math.min(shownParagraphs.length - 1, Math.max(0, activeIndex + delta));
    setActiveParagraphIndex(next);
    setRulerLine(0);
    setLines([]);

    // Auto-scroll ke posisi paragraf yang baru jika posisinya sudah tersimpan
    setTimeout(() => {
      const yPosition = paragraphPositions.current[next];
      if (yPosition !== undefined && scrollViewRef.current) {
        // Kurangi sedikit offset agar judul paragraf (Paragraf X dari Y) juga terlihat utuh
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
        current.length === next.length && current.every((line, i) => line.y === next[i].y && line.height === next[i].height);
      return unchanged ? current : next;
    });
  };

  return (
    <>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 8 }}>
        {/* Judul dokumen + preset tipografi */}
        <View className="flex-row items-center justify-between px-4 pb-3">
          <View className="flex-1 pr-3">
            <Text className="mb-1 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-text-muted">
              DOKUMEN
            </Text>
            <Text className="font-opendyslexic-bold text-base text-text-main" numberOfLines={1}>
              {isScanned ? 'Hasil Pindaian' : DOC_TITLE}
            </Text>
          </View>
          <Pressable
            onPress={() => setTypographyOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ubah tipografi"
            className="flex-row items-center rounded-xl bg-primary/10 px-3.5 py-2">
            <Type size={14} color={colors.primary} />
            <Text className="ml-2 font-opendyslexic-bold text-xs text-primary">{typeLevel.name}</Text>
          </Pressable>
        </View>

        {/* Level penyederhanaan */}
        <View className="px-4 pb-2">
          <Text className="mb-2 font-opendyslexic text-[10px] text-text-muted">
            <Text className="font-opendyslexic-bold text-warm">🧠 LEVEL </Text>
            <Text className="font-opendyslexic-bold text-primary">{level.name}</Text>
            <Text> — {level.tagline}</Text>
          </Text>
          <View className="flex-row">
            {SIMPLIFY_LEVELS.map((item) => {
              const selected = item.id === simplifyLevel;

              return (
                <Pressable
                  key={item.id}
                  onPress={() => setSimplifyLevel(item.id as SimplifyLevelId)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Level ${item.id}: ${item.name}`}
                  className={`mr-2 flex-1 items-center rounded-lg py-2 ${
                    selected ? 'bg-primary' : 'bg-surface-alt'
                  }`}>
                  <Text
                    className={`font-opendyslexic-bold text-[11px] ${selected ? 'text-white' : 'text-text-muted'}`}>
                    {item.id}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {needsAi && simplifyLoading ? (
            <Text className="mt-2 font-opendyslexic text-[9px] text-primary">
              🦉 Lexi sedang menyederhanakan teksnya… sementara ini teks asli dulu.
            </Text>
          ) : null}
          {needsAi && !simplifyLoading && simplifyError ? (
            <Pressable onPress={fetchSimplified} accessibilityRole="button" hitSlop={6}>
              <Text className="mt-2 font-opendyslexic text-[9px] text-text-muted">
                ⚠️ {simplifyError} <Text className="font-opendyslexic-bold text-primary">Ketuk untuk coba lagi.</Text>
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Sakelar fitur baca */}
        <View className="flex-row items-center border-b border-border px-4 pb-3 pt-1">
          <FeatureChip
            active={focusMode}
            onPress={toggleFocusMode}
            icon={<Focus size={13} color={focusMode ? '#FFFFFF' : colors.textMuted} />}
            label={focusMode ? 'Fokus Aktif' : 'Fokus'}
          />
          <FeatureChip
            active={rulerMode}
            onPress={toggleRulerMode}
            icon={<Ruler size={13} color={rulerMode ? '#FFFFFF' : colors.textMuted} />}
            label={rulerMode ? 'Penggaris ✓' : 'Penggaris'}
          />
          <FeatureChip
            active={bicolorMode}
            onPress={toggleBicolorMode}
            icon={<Palette size={13} color={bicolorMode ? '#FFFFFF' : colors.textMuted} />}
            label={bicolorMode ? 'Bicolor ✓' : 'Bicolor'}
          />

          {/* Indikator posisi paragraf (tanpa tombol panah ganda yang membingungkan) */}
          <View className="ml-auto flex-row items-center">
            <Text className="font-opendyslexic-bold text-[10px] text-text-muted">
              {activeIndex + 1}/{shownParagraphs.length}
            </Text>
          </View>
        </View>

        {/* Isi bacaan */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 20, paddingBottom: 28 }}>
          <Text className="mb-4 font-opendyslexic-bold text-[11px] uppercase tracking-widest text-warm">
            {isScanned ? 'TEKS HASIL PINDAIAN' : DOC_SECTION}
          </Text>

          {shownParagraphs.map((paragraph, index) => {
            const isActive = index === activeIndex;
            const dimmed = focusMode && !isActive;
            const showRuler = rulerMode && isActive && lines.length > 0;
            const rulerTarget = lines[Math.min(rulerLine, lines.length - 1)];

            // Hanya tampilkan paragraf aktif jika mode fokus menyala. Jika mati, tampilkan semua.
            if (focusMode && !isActive) return null;

            return (
              <View
                key={index}
                onLayout={(event) => {
                  const layout = event.nativeEvent.layout;
                  paragraphPositions.current[index] = layout.y;
                }}
                className={`mb-6 ${
                  isActive ? 'rounded-2xl border-l-4 border-primary bg-primary/5 p-4' : ''
                }`}>
                {isActive ? (
                  <Text className="mb-2 font-opendyslexic-bold text-[9px] uppercase tracking-widest text-primary">
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
                      rulerMode && isActive ? (event) => syncLines(event.nativeEvent.lines) : undefined
                    }>
                    {paragraph}
                  </DyslexicText>
                </View>

                {showRuler ? (
                  <View className="mt-2 flex-row items-center">
                    <Pressable
                      onPress={() => moveRuler(-1)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Penggaris naik satu baris"
                      className="mr-1.5 h-7 w-7 items-center justify-center rounded-lg bg-surface-alt">
                      <ChevronUp size={13} color={colors.textMuted} />
                    </Pressable>
                    <Pressable
                      onPress={() => moveRuler(1)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Penggaris turun satu baris"
                      className="mr-2 h-7 w-7 items-center justify-center rounded-lg bg-surface-alt">
                      <ChevronDown size={13} color={colors.textMuted} />
                    </Pressable>
                    <Text className="font-opendyslexic text-[9px] text-text-muted">
                      Baris {Math.min(rulerLine, lines.length - 1) + 1} dari {lines.length}
                    </Text>
                  </View>
                ) : null}

                {/* Tombol navigasi paragraf di bawah paragraf aktif — selalu ada di setiap paragraf yang difokuskan/diaktifkan */}
                {isActive ? (
                  <View className="mt-6 flex-row items-center justify-between border-t border-border/50 pt-4">
                    <Pressable
                      onPress={() => moveParagraph(-1)}
                      disabled={activeIndex === 0}
                      accessibilityRole="button"
                      accessibilityLabel="Paragraf sebelumnya"
                      className="h-11 flex-1 flex-row items-center justify-center gap-2 mr-2 rounded-xl bg-primary/10 disabled:opacity-30">
                      <ChevronLeft size={18} color={colors.primary} />
                      <Text className="font-opendyslexic-bold text-[11px] text-primary">SEBELUM</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => moveParagraph(1)}
                      disabled={activeIndex >= shownParagraphs.length - 1}
                      accessibilityRole="button"
                      accessibilityLabel="Paragraf berikutnya"
                      className="h-11 flex-1 flex-row items-center justify-center gap-2 ml-2 rounded-xl bg-primary/10 disabled:opacity-30">
                      <Text className="font-opendyslexic-bold text-[11px] text-primary">BERIKUT</Text>
                      <ChevronRight size={18} color={colors.primary} />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}

          {bicolorMode ? (
            <View className="rounded-2xl border border-border bg-surface p-3">
              <Text className="font-opendyslexic text-[9px] leading-4 text-text-muted">
                <Text className="font-opendyslexic-bold text-primary">🌈 Bicolor Aktif</Text> — kata bergantian warna
                membantu mata melacak posisi.
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Aksi bawah */}
        <View className="border-t border-border px-4 pb-3 pt-3">
          <Pressable
            onPress={() =>
              setExplainTarget({
                term: shownParagraphs[activeIndex],
                context: shownParagraphs[activeIndex],
                // Dokumen contoh punya jawaban kurasi; teks pindaian dijelaskan AI beneran.
                useStaticAnswers: !isScanned,
              })
            }
            accessibilityRole="button"
            className="mb-2 flex-row items-center justify-center rounded-2xl bg-primary/10 py-3.5">
            <Lightbulb size={15} color={colors.primary} />
            <Text className="ml-2 font-opendyslexic-bold text-xs text-primary">Jelaskan Teks Ini</Text>
          </Pressable>
          <Text className="text-center font-opendyslexic text-[9px] text-text-muted">
            💡 Ketuk kata apapun untuk melihat lebih jelas
          </Text>
        </View>
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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      className={`mr-2 flex-row items-center rounded-full px-3 py-1.5 ${
        active ? 'bg-primary' : 'border border-border bg-surface'
      }`}>
      {icon}
      <Text
        className={`ml-1.5 font-opendyslexic-bold text-[10px] ${active ? 'text-white' : 'text-text-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
