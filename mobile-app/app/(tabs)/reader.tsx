import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View, type TextLayoutLine } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  BookOpen,
  Camera,
  ChevronDown,
  ChevronUp,
  Focus,
  GripHorizontal,
  Lightbulb,
  MoveHorizontal,
  Palette,
  Ruler,
  Sparkles,
  Type,
  Volume2,
  Square,
  WholeWord,
} from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { GRADIENTS } from '../../src/theme/palettes';
import { SIMPLIFY_LEVEL_IDS, type SimplifyLevelId } from '../../src/data/sample-document';
import { useT } from '../../src/i18n';
import { simplifyText, AiApiError } from '../../src/api/ai';
import { DyslexicText } from '../../src/components/dyslexic-text';
import { PressableScale } from '../../src/components/pressable-scale';
import { TextSkeleton } from '../../src/components/text-skeleton';
import { FootprintChip } from '../../src/components/footprint-chip';
import { TypographySheet } from '../../src/components/typography-sheet';
import { ExplainSheet, type ExplainTarget } from '../../src/components/explain-sheet';
import { WordSheet } from '../../src/components/word-sheet';
import { SpeakButton } from '../../src/components/speak-button';
import { useAutoSpeak, useSpeech, useStopSpeechOnBlur } from '../../src/speech/use-speech';
import { Blob, Ring, Sparkle } from '../../src/components/figma-decor';

type LineMetric = { y: number; height: number };

const SWIPE_THRESHOLD = 55;

const SPRING = { damping: 20, stiffness: 260, mass: 0.6 } as const;

export default function ReaderScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const t = useT();
  const pushPreference = useAuthStore((s) => s.pushPreference);

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
    syllableSpacing,
    setSyllableSpacing,
    activeParagraphIndex,
    setActiveParagraphIndex,
  } = useOCRStore();

  const [typographyOpen, setTypographyOpen] = useState(false);
  const [explainTarget, setExplainTarget] = useState<ExplainTarget | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [lineCount, setLineCount] = useState(0);
  const [rulerLine, setRulerLine] = useState(0);
  const [simplifyLoading, setSimplifyLoading] = useState(false);
  const [simplifyError, setSimplifyError] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const paragraphPositions = useRef<{ [key: number]: number }>({});

  // Shared value, bukan state React: seretan jari dijawab di UI thread.
  const lineMetrics = useSharedValue<LineMetric[]>([]);
  const rulerIndex = useSharedValue(0);
  const swipeX = useSharedValue(0);

  const typeLevelName = t.typeLevels[typeLevelId].name;
  const activeLevel = t.simplifyLevels[simplifyLevel];

  /**
   * Teks pindaian: L1 adalah hasil OCR apa adanya; L2–L5 diminta ke backend
   * (POST /api/simplify-text) dan di-cache per level di store.
   */
  const isScanned = rawText.trim().length > 0;

  // Judul bagian tidak ikut disambung supaya tidak mengulang judul di kartu atas.
  const textToSimplify = isScanned ? rawText : t.sampleDoc.paragraphs.join('\n\n');

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
        setSimplifyError(e instanceof AiApiError ? e.message : t.reader.unexpectedError),
      )
      .finally(() => setSimplifyLoading(false));
  }, [textToSimplify, simplifyLevel, setAiParagraphs, t]);

  useEffect(() => {
    if (needsAi && !aiResult) fetchSimplified();
  }, [needsAi, aiResult, fetchSimplified]);

  const paragraphs = useMemo(() => {
    if (simplifyLevel === 'L1') return scannedParagraphs;
    return aiResult ?? scannedParagraphs;
  }, [simplifyLevel, aiResult, scannedParagraphs]);

  const activeIndex = Math.min(activeParagraphIndex, Math.max(0, paragraphs.length - 1));
  const shownParagraphs = paragraphs.length > 0 ? paragraphs : [t.reader.emptyText];

  const showSkeleton = needsAi && simplifyLoading && !aiResult;

  const { enabled: ttsEnabled, toggle: toggleSpeech, speakingKey } = useSpeech();

  useStopSpeechOnBlur();

  /*
   * Paragraf aktif dibacakan sendiri bagi yang presetnya memang meminta
   * demikian — yang belum bisa membaca sama sekali. Yang dikirim `paragraphs`,
   * bukan yang tampil di layar: teks di layar sudah dipenggal suku kata, dan
   * "Mi to kon dri a" akan dilafalkan sebagai lima kata terpisah.
   *
   * Dijeda selama kerangka pemuatan masih tampil, kalau tidak yang terbacakan
   * adalah teks level sebelumnya yang sebentar lagi diganti.
   */
  useAutoSpeak(shownParagraphs[activeIndex] ?? null, `paragraph:${activeIndex}`, !showSkeleton);

  const moveParagraph = useCallback(
    (delta: number) => {
      const total = paragraphs.length > 0 ? paragraphs.length : 1;
      const next = Math.min(total - 1, Math.max(0, activeIndex + delta));
      if (next === activeIndex) return;

      setActiveParagraphIndex(next);
      setRulerLine(0);
      setLineCount(0);
      rulerIndex.value = 0;
      lineMetrics.value = [];

      setTimeout(() => {
        const yPosition = paragraphPositions.current[next];
        if (yPosition !== undefined && scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: Math.max(0, yPosition - 30), animated: true });
        }
      }, 100);
    },
    [activeIndex, paragraphs.length, setActiveParagraphIndex, rulerIndex, lineMetrics],
  );

  const moveRuler = (delta: number) => {
    const maxLine = Math.max(0, lineCount - 1);
    const next = Math.min(maxLine, Math.max(0, rulerIndex.value + delta));
    rulerIndex.value = next;
    setRulerLine(next);
  };

  /**
   * onTextLayout terpanggil tiap render dengan array `lines` yang selalu objek
   * baru, jadi perlu dibandingkan isinya supaya tidak render tanpa henti.
   */
  const syncLines = useCallback(
    (next: TextLayoutLine[]) => {
      const current = lineMetrics.value;
      const unchanged =
        current.length === next.length &&
        current.every((line, i) => line.y === next[i].y && line.height === next[i].height);
      if (unchanged) return;

      lineMetrics.value = next.map((line) => ({ y: line.y, height: line.height }));
      setLineCount(next.length);
    },
    [lineMetrics],
  );

  useAnimatedReaction(
    () => rulerIndex.value,
    (current, previous) => {
      if (current !== previous) scheduleOnRN(setRulerLine, current);
    },
  );

  /**
   * `activeOffsetX` + `failOffsetY` dua-duanya perlu, kalau tidak menggulung
   * halaman ikut terbaca sebagai geser paragraf.
   */
  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-25, 25])
        .failOffsetY([-20, 20])
        .onUpdate((event) => {
          swipeX.value = event.translationX * 0.3;
        })
        .onEnd((event) => {
          if (event.translationX <= -SWIPE_THRESHOLD) scheduleOnRN(moveParagraph, 1);
          else if (event.translationX >= SWIPE_THRESHOLD) scheduleOnRN(moveParagraph, -1);
          swipeX.value = withSpring(0, SPRING);
        })
        .onFinalize(() => {
          swipeX.value = withSpring(0, SPRING);
        }),
    [moveParagraph, swipeX],
  );

  const pageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: swipeX.value }] }));

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
                  className="flex-row items-center rounded-[14px] border border-white/[0.15] bg-white/10 px-3 py-1.5"
                  style={{ gap: 6 }}>
                  <BookOpen size={12} color="#ffffff" />
                  <Text className="font-ui-bold text-xs text-white">{t.reader.nowReading}</Text>
                </View>
              </View>
              <Text className="mt-1.5 font-ui-bold text-[17px] text-white" numberOfLines={1}>
                {isScanned ? t.reader.scanResult : t.sampleDoc.title}
              </Text>
            </View>

            <PressableScale
              onPress={() => setTypographyOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`${t.reader.changeTypeLabel} ${typeLevelName}`}
              className="h-11 flex-row items-center rounded-[16px] border border-white/20 bg-white/[0.14] px-3.5"
              style={{ gap: 6 }}>
              <Type size={16} color="#ffffff" />
              <Text className="font-ui-bold text-[13px] text-white">{typeLevelName}</Text>
            </PressableScale>
          </View>
        </LinearGradient>

        {/* ── Bilah kontrol ─────────────────────────────────────────────── */}
        <View
          className="border-b bg-surface/60 px-4 py-3"
          style={{ borderBottomColor: colors.border }}>
          {/* Level penyederhanaan */}
          <View className="flex-row items-center" style={{ gap: 8 }}>
            <View
              className="h-12 flex-row items-center rounded-[16px] border border-primary/20 bg-primary/[0.12] px-3"
              style={{ gap: 6 }}>
              <Sparkles size={14} color={colors.primary} />
              <Text className="font-ui-bold text-xs text-primary">{t.reader.aiBadge}</Text>
            </View>

            <View
              className="h-12 flex-1 flex-row rounded-[16px] bg-primary/[0.06] p-1"
              style={{ gap: 4 }}>
              {SIMPLIFY_LEVEL_IDS.map((levelId: SimplifyLevelId) => {
                const item = t.simplifyLevels[levelId];
                const selected = levelId === simplifyLevel;

                return (
                  <PressableScale
                    key={levelId}
                    onPress={() => setSimplifyLevel(levelId)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${t.reader.levelLabel} ${item.name}. ${item.tagline}`}
                    scaleTo={0.93}
                    wrapperStyle={{ flex: 1 }}
                    style={{ flex: 1 }}>
                    {selected ? (
                      <LinearGradient
                        colors={[...GRADIENTS.activePill.colors]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          flex: 1,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        <Text className="font-ui-bold text-xs text-white">{item.short}</Text>
                      </LinearGradient>
                    ) : (
                      <View className="flex-1 items-center justify-center rounded-xl">
                        <Text className="font-ui-bold text-xs text-text-muted">{item.short}</Text>
                      </View>
                    )}
                  </PressableScale>
                );
              })}
            </View>
          </View>

          <Text className="mt-2 font-ui-medium text-xs text-text-muted">
            <Text className="font-ui-bold text-primary">{activeLevel.name}</Text>
            {' · '}
            {activeLevel.tagline}
          </Text>

          {/* Sakelar fitur baca + navigasi paragraf */}
          <View className="mt-3 flex-row items-center" style={{ gap: 8 }}>
            <FeatureChip
              active={focusMode}
              onPress={toggleFocusMode}
              icon={<Focus size={16} color={focusMode ? '#ffffff' : colors.textMuted} />}
              label={t.reader.focus}
            />
            <FeatureChip
              active={rulerMode}
              onPress={toggleRulerMode}
              icon={<Ruler size={16} color={rulerMode ? '#ffffff' : colors.textMuted} />}
              label={t.reader.ruler}
            />
            <FeatureChip
              active={bicolorMode}
              onPress={toggleBicolorMode}
              icon={<Palette size={16} color={bicolorMode ? '#ffffff' : colors.textMuted} />}
              label={t.reader.bicolor}
            />
            {/*
              Pemenggalan suku kata, dulu hanya bisa diubah lewat layar Atur.
              Ditaruh di sini karena inilah satu-satunya tempat akibatnya
              terlihat — dan yang membutuhkannya sedang membaca, bukan sedang
              membuka pengaturan.
            */}
            <FeatureChip
              active={syllableSpacing}
              onPress={() => {
                const next = !syllableSpacing;
                setSyllableSpacing(next);
                void pushPreference({ syllable_spacing: next });
              }}
              icon={<WholeWord size={16} color={syllableSpacing ? '#ffffff' : colors.textMuted} />}
              label={t.reader.syllables}
            />
          </View>

          <View className="mt-3 flex-row items-center" style={{ gap: 8 }}>
            <View
              className="h-9 flex-1 flex-row items-center rounded-[14px] bg-primary/[0.05] px-3"
              style={{ gap: 6 }}>
              <MoveHorizontal size={14} color={colors.textMuted} />
              <Text className="font-ui-medium text-xs text-text-muted">
                {t.reader.swipeHint}
              </Text>
            </View>

            <PressableScale
              onPress={() => moveParagraph(-1)}
              disabled={activeIndex === 0}
              accessibilityRole="button"
              accessibilityLabel={t.reader.prevParagraph}
              scaleTo={0.9}
              className="h-11 w-11 items-center justify-center rounded-[16px] bg-primary/[0.07] disabled:opacity-40">
              <ChevronUp size={18} color={colors.primary} />
            </PressableScale>
            <Text className="font-ui-bold text-xs text-text-muted">
              {activeIndex + 1}/{shownParagraphs.length}
            </Text>
            <PressableScale
              onPress={() => moveParagraph(1)}
              disabled={activeIndex >= shownParagraphs.length - 1}
              accessibilityRole="button"
              accessibilityLabel={t.reader.nextParagraph}
              scaleTo={0.9}
              className="h-11 w-11 items-center justify-center rounded-[16px] bg-primary/[0.07] disabled:opacity-40">
              <ChevronDown size={18} color={colors.primary} />
            </PressableScale>
          </View>

          {/* PressableScale, bukan Pressable polos: hanya lewat komponen itu nama
              tombolnya ikut dibacakan bagi yang belum bisa membaca. */}
          {needsAi && !simplifyLoading && simplifyError ? (
            <PressableScale
              onPress={fetchSimplified}
              accessibilityRole="button"
              accessibilityLabel={t.reader.retryLabel}
              scaleTo={0.98}
              className="mt-2.5 rounded-[14px] bg-primary/[0.06] px-3 py-2.5">
              <Text className="font-ui-medium text-xs leading-5 text-text-muted">
                {simplifyError}{' '}
                <Text className="font-ui-bold text-primary">{t.reader.retryLink}</Text>
              </Text>
            </PressableScale>
          ) : null}
        </View>

        {/* ── Isi bacaan ────────────────────────────────────────────────── */}
        <GestureDetector gesture={swipeGesture}>
          <ScrollView
            ref={scrollViewRef}
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
            {/* Tanpa penanda ini, dokumen contoh terlihat seperti hasil pindaian sendiri. */}
            {!isScanned ? (
              <PressableScale
                onPress={() => router.push('/scanner')}
                accessibilityRole="button"
                accessibilityLabel={t.reader.sampleLabel}
                className="mb-4 flex-row items-center rounded-2xl border border-primary/20 bg-primary/[0.06] p-4"
                style={{ gap: 12 }}>
                <View className="h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10">
                  <Camera size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-ui-bold text-sm text-text-main">{t.reader.sampleTitle}</Text>
                  <Text className="mt-0.5 font-ui-medium text-xs leading-[18px] text-text-muted">
                    {t.reader.sampleDesc}
                  </Text>
                </View>
              </PressableScale>
            ) : null}

            {/* Judul bagian dokumen */}
            <View
              className="flex-row items-center rounded-2xl bg-primary/[0.06] px-3.5 py-3"
              style={{ gap: 10 }}>
              <LinearGradient
                colors={[...GRADIENTS.activePill.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={{ width: 4, height: 40, borderRadius: 2 }}
              />
              <Text className="flex-1 font-read-bold text-sm leading-6 text-text-main">
                {isScanned ? t.reader.scannedTextTitle : t.sampleDoc.sectionTitle}
              </Text>
            </View>

            {showSkeleton ? (
              <>
                <View
                  className="mt-4 flex-row items-center rounded-2xl bg-primary/[0.06] px-3.5 py-3"
                  style={{ gap: 10 }}>
                  <Sparkles size={16} color={colors.primary} />
                  <Text className="flex-1 font-ui-medium text-[13px] text-primary">
                    {t.reader.simplifying(activeLevel.name)}
                  </Text>
                </View>
                <TextSkeleton />
              </>
            ) : (
              <Animated.View style={pageStyle}>
                {shownParagraphs.map((paragraph, index) => (
                  <ParagraphBlock
                    key={`${simplifyLevel}-${index}`}
                    paragraph={paragraph}
                    index={index}
                    total={shownParagraphs.length}
                    isActive={index === activeIndex}
                    focusMode={focusMode}
                    rulerMode={rulerMode}
                    bicolor={bicolorMode}
                    lineMetrics={lineMetrics}
                    rulerIndex={rulerIndex}
                    onLayoutY={(y) => {
                      paragraphPositions.current[index] = y;
                    }}
                    onWordPress={setSelectedWord}
                    onSyncLines={syncLines}
                  />
                ))}
              </Animated.View>
            )}

            {/* Hanya untuk level yang benar-benar memanggil AI: di L1 teksnya
                asli, jadi menampilkan jejak karbon di sana akan menyesatkan. */}
            {needsAi && !showSkeleton ? <FootprintChip /> : null}

            {rulerMode && !showSkeleton && lineCount > 0 ? (
              <View
                className="mt-5 flex-row items-center rounded-2xl bg-primary/[0.06] p-3"
                style={{ gap: 8 }}>
                <GripHorizontal size={16} color={colors.primary} />
                <Text className="flex-1 font-ui-medium text-xs leading-[18px] text-text-muted">
                  {t.reader.rulerHintLead}
                  <Text className="font-ui-bold text-primary">
                    {t.reader.rulerLineOf(Math.min(rulerLine, lineCount - 1) + 1, lineCount)}
                  </Text>
                </Text>
                <PressableScale
                  onPress={() => moveRuler(-1)}
                  accessibilityRole="button"
                  accessibilityLabel={t.reader.rulerUp}
                  scaleTo={0.9}
                  className="h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10">
                  <ChevronUp size={18} color={colors.primary} />
                </PressableScale>
                <PressableScale
                  onPress={() => moveRuler(1)}
                  accessibilityRole="button"
                  accessibilityLabel={t.reader.rulerDown}
                  scaleTo={0.9}
                  className="h-11 w-11 items-center justify-center rounded-[16px] bg-primary/10">
                  <ChevronDown size={18} color={colors.primary} />
                </PressableScale>
              </View>
            ) : null}
          </ScrollView>
        </GestureDetector>

        {/* ── Aksi bawah ────────────────────────────────────────────────── */}
        <LinearGradient
          colors={['rgba(0,0,0,0)', colors.background]}
          locations={[0, 0.45]}
          style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12 }}>
          <View className="flex-row" style={{ gap: 10 }}>
            {/*
              Tombol besar, bukan hanya ikon kecil di samping nomor paragraf.
              Pengguna yang paling membutuhkan suara adalah yang paling kecil
              kemungkinannya menemukan tombol kecil — jadi yang utama ditaruh di
              tempat ibu jari sudah berada.
            */}
            {ttsEnabled ? (
              <PressableScale
                onPress={() =>
                  toggleSpeech(shownParagraphs[activeIndex], `paragraph:${activeIndex}`)
                }
                accessibilityRole="button"
                accessibilityLabel={t.speech.readParagraph(activeIndex + 1)}
                scaleTo={0.97}
                wrapperStyle={{ flex: 1 }}>
                <LinearGradient
                  colors={[...GRADIENTS.activePill.colors]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 56,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 16,
                  }}>
                  {speakingKey === `paragraph:${activeIndex}` ? (
                    <Square size={15} color="#ffffff" fill="#ffffff" />
                  ) : (
                    <Volume2 size={18} color="#ffffff" />
                  )}
                  <Text className="font-ui-bold text-base text-white">{t.speech.readAloud}</Text>
                </LinearGradient>
              </PressableScale>
            ) : null}

            <PressableScale
              onPress={() =>
                setExplainTarget({
                  term: shownParagraphs[activeIndex],
                  context: shownParagraphs[activeIndex],
                  // Dokumen contoh punya jawaban kurasi; teks pindaian dijelaskan AI beneran.
                  useStaticAnswers: !isScanned,
                })
              }
              accessibilityRole="button"
              accessibilityLabel={t.reader.explainButtonLabel}
              scaleTo={0.97}
              wrapperStyle={{ flex: 1 }}>
              <LinearGradient
                colors={['rgba(124,58,237,0.12)', 'rgba(79,70,229,0.12)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 56,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(124,58,237,0.2)',
                }}>
                <Lightbulb size={18} color={colors.primary} />
                <Text className="font-ui-bold text-base text-primary">
                  {t.reader.explainButton}
                </Text>
              </LinearGradient>
            </PressableScale>
          </View>

          <View
            className="mt-3 h-10 flex-row items-center justify-center rounded-[14px] bg-primary/[0.04]"
            style={{ gap: 8 }}>
            <Lightbulb size={14} color={colors.textMuted} />
            <Text className="font-ui-medium text-xs text-text-muted">
              {t.reader.tapWordHint}
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

/** Komponen tersendiri karena tiap paragraf butuh hook animasinya sendiri. */
function ParagraphBlock({
  paragraph,
  index,
  total,
  isActive,
  focusMode,
  rulerMode,
  bicolor,
  lineMetrics,
  rulerIndex,
  onLayoutY,
  onWordPress,
  onSyncLines,
}: {
  paragraph: string;
  index: number;
  total: number;
  isActive: boolean;
  focusMode: boolean;
  rulerMode: boolean;
  bicolor: boolean;
  lineMetrics: SharedValue<LineMetric[]>;
  rulerIndex: SharedValue<number>;
  onLayoutY: (y: number) => void;
  onWordPress: (word: string) => void;
  onSyncLines: (lines: TextLayoutLine[]) => void;
}) {
  const t = useT();
  const dimmed = focusMode && !isActive;
  const showRuler = rulerMode && isActive;

  const focusStyle = useAnimatedStyle(() => ({
    opacity: withTiming(dimmed ? 0.4 : 1, { duration: 220 }),
  }));

  const rulerStyle = useAnimatedStyle(() => {
    const metrics = lineMetrics.value;
    if (metrics.length === 0) return { opacity: 0, top: 0, height: 0 };

    const clamped = Math.min(Math.max(rulerIndex.value, 0), metrics.length - 1);
    const line = metrics[clamped];

    return {
      opacity: 1,
      top: withSpring(line.y, SPRING),
      height: line.height,
    };
  });

  /** Indeks baris dihitung di UI thread supaya garisnya mengikuti jari tanpa melewati React. */
  const rulerGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin((event) => {
          const metrics = lineMetrics.value;
          if (metrics.length === 0) return;

          let found = 0;
          for (let i = 0; i < metrics.length; i += 1) {
            if (event.y >= metrics[i].y) found = i;
          }
          rulerIndex.value = found;
        })
        .onUpdate((event) => {
          const metrics = lineMetrics.value;
          if (metrics.length === 0) return;

          let found = 0;
          for (let i = 0; i < metrics.length; i += 1) {
            if (event.y >= metrics[i].y) found = i;
          }
          rulerIndex.value = found;
        }),
    [lineMetrics, rulerIndex],
  );

  const body = (
    <View className="relative">
      {showRuler ? (
        <Animated.View
          pointerEvents="none"
          className="absolute left-0 right-0 rounded-md bg-highlight"
          style={rulerStyle}
        />
      ) : null}
      <DyslexicText
        bicolor={bicolor}
        dimmed={dimmed}
        onWordPress={dimmed ? undefined : onWordPress}
        onTextLayout={
          rulerMode && isActive ? (event) => onSyncLines(event.nativeEvent.lines) : undefined
        }>
        {paragraph}
      </DyslexicText>
    </View>
  );

  return (
    <Animated.View
      onLayout={(event) => onLayoutY(event.nativeEvent.layout.y)}
      style={focusStyle}
      className={
        isActive ? 'mt-4 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4' : 'mt-6'
      }>
      {/*
        Mode Fokus meredupkan paragraf lain, bukan menyembunyikannya —
        pembaca tetap bisa melihat konteks di sekitarnya.
      */}
      {/*
        Tombol suara hanya di paragraf aktif. Satu tombol per paragraf akan
        memenuhi layar dengan tombol yang semuanya melakukan hal serupa, dan
        justru layar bacaan yang harus paling tenang.
      */}
      {isActive ? (
        <View className="mb-2.5 flex-row items-center" style={{ gap: 8 }}>
          <Text className="flex-1 font-ui-bold text-xs text-primary">
            {t.reader.paragraphOf(index + 1, total)}
          </Text>
          <SpeakButton
            text={paragraph}
            speechKey={`paragraph:${index}`}
            size={16}
          />
        </View>
      ) : null}

      {showRuler ? <GestureDetector gesture={rulerGesture}>{body}</GestureDetector> : body}
    </Animated.View>
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
  const content = (
    <>
      {icon}
      <Text className={`font-ui-bold text-xs ${active ? 'text-white' : 'text-text-muted'}`}>
        {label}
      </Text>
    </>
  );

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      accessibilityLabel={label}
      scaleTo={0.93}
      wrapperStyle={{ flex: 1 }}>
      {active ? (
        <LinearGradient
          colors={[...GRADIENTS.activePill.colors]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingHorizontal: 8,
            borderRadius: 16,
          }}>
          {content}
        </LinearGradient>
      ) : (
        <View
          className="h-11 flex-row items-center justify-center rounded-[16px] bg-primary/[0.07] px-2"
          style={{ gap: 6 }}>
          {content}
        </View>
      )}
    </PressableScale>
  );
}
