import { useCallback, useMemo, useState } from 'react';
import { Text, View, type TextLayoutLine } from 'react-native';
import {
  AudioLines,
  ChevronDown,
  ChevronUp,
  Focus,
  Lightbulb,
  Palette,
  Ruler,
  WholeWord,
} from 'lucide-react-native';

import { useT } from '../i18n';
import { normalizeSpeechText } from '../speech/speech-service';
import { syllableForSpeech } from '../speech/syllable-speech';
import { useAutoSpeak, useSpeech } from '../speech/use-speech';
import { useAuthStore } from '../store/useAuthStore';
import { useOCRStore } from '../store/useStore';
import { useThemeColors } from '../theme/theme-provider';
import { alignWordIndex, speechWordCount, wordIndexAtChar } from '../utils/word-highlight';
import { DyslexicText, spellableWords } from './dyslexic-text';
import { FeatureChip } from './feature-chip';
import { FootprintChip } from './footprint-chip';
import { LexiMascot } from './illustrations';
import { PressableScale } from './pressable-scale';
import { SpeakButton } from './speak-button';

/** Gelembung chat Lexi: maskot di kiri, isi di kanan. */
export function LexiBubble({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row">
      <View className="mr-3 h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primary/10">
        <LexiMascot size={34} />
      </View>
      <View className="flex-1 rounded-3xl rounded-tl-lg border border-border/10 bg-surface p-4">
        {children}
      </View>
    </View>
  );
}

/**
 * Potong paragraf jadi kalimat untuk Mode Fokus.
 *
 * Jawaban Lexi sering hanya satu paragraf, jadi kalau Fokus meredupkan
 * paragraf lain seperti di layar Baca, tombolnya tidak berbuat apa-apa. Di sini
 * satuannya kalimat: satu kalimat terang, sisanya redup.
 */
function splitSentences(paragraph: string): string[] {
  const sentences = (paragraph.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return sentences.length > 0 ? sentences : [paragraph];
}

type Line = { y: number; height: number; words: number };

/** Kata yang sedang berbunyi: di satuan ke berapa, kata ke berapa, suku kata ke berapa. */
type Spot = { unit: number; word: number; syllable: number | null };

/**
 * Jawaban Lexi dengan alat baca yang sama seperti layar Baca.
 *
 * Dulu jawabannya hanya teks dan tombol suara. Padahal anak yang membuka Tanya
 * Lexi justru sedang kesulitan, jadi alat yang menolongnya di layar Baca harus
 * ikut ada di sini: Fokus, Penggaris, Dua Warna, Su-ku, dan Eja. Keempat
 * sakelar pertama memakai pengaturan yang sama dengan layar Baca, jadi
 * menyalakannya di satu tempat berlaku di keduanya. Eja tetap sesaat, seperti
 * di layar Baca.
 */
export function AnswerReader({ paragraphs, speechKey }: { paragraphs: string[]; speechKey: string }) {
  const colors = useThemeColors();
  const t = useT();
  const pushPreference = useAuthStore((s) => s.pushPreference);

  const focusMode = useOCRStore((s) => s.focusMode);
  const toggleFocusMode = useOCRStore((s) => s.toggleFocusMode);
  const rulerMode = useOCRStore((s) => s.rulerMode);
  const toggleRulerMode = useOCRStore((s) => s.toggleRulerMode);
  const bicolorMode = useOCRStore((s) => s.bicolorMode);
  const toggleBicolorMode = useOCRStore((s) => s.toggleBicolorMode);
  const syllableSpacing = useOCRStore((s) => s.syllableSpacing);
  const setSyllableSpacing = useOCRStore((s) => s.setSyllableSpacing);
  const language = useOCRStore((s) => s.language);

  const { enabled: ttsEnabled, speakSequence, stop, speakingKey } = useSpeech();

  const [spellMode, setSpellMode] = useState(false);
  const [activeUnit, setActiveUnit] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [rulerLine, setRulerLine] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);

  // Jawaban dibacakan sebagai satu ucapan; lihat explain-sheet.
  const spoken = paragraphs.join(' ');
  const spellKey = `${speechKey}:spell`;

  const units = useMemo(
    () => (focusMode ? paragraphs.flatMap(splitSentences) : paragraphs),
    [focusMode, paragraphs],
  );

  /*
   * Nomor kata pertama tiap satuan di dalam teks ucapan. `onBoundary` hanya
   * memberi posisi di ucapan utuh, dan dari sinilah ketahuan kata itu duduk di
   * kalimat atau paragraf yang mana.
   */
  const offsets = useMemo(() => {
    const counts = units.map((unit) => speechWordCount(unit));

    return counts.map((_, i) => counts.slice(0, i).reduce((sum, n) => sum + n, 0));
  }, [units]);

  const unit = Math.min(activeUnit, units.length - 1);
  const spelling = spellMode && ttsEnabled;

  // Sorotan hanya hidup selama suaranya sendiri berbunyi, seperti di layar Baca.
  const voiceActive = speakingKey === speechKey || speakingKey === spellKey;
  const shownSpot = voiceActive ? spot : null;

  const lineOfWord = useCallback(
    (word: number) => {
      let seen = 0;
      for (let i = 0; i < lines.length; i += 1) {
        seen += lines[i].words;
        if (word < seen) return i;
      }

      return Math.max(lines.length - 1, 0);
    },
    [lines],
  );

  /*
   * Penggaris mengikuti kata yang berbunyi; selain itu tetap di baris pilihan
   * pengguna. Diturunkan saat render supaya tidak tertinggal satu langkah dari
   * baris yang baru diukur.
   */
  const shownRulerLine =
    shownSpot && shownSpot.unit === unit
      ? lineOfWord(shownSpot.word)
      : Math.min(rulerLine, Math.max(lines.length - 1, 0));
  const band = rulerMode ? lines[shownRulerLine] : undefined;

  const handleBoundary = useCallback(
    (charIndex: number) => {
      const word = alignWordIndex(
        wordIndexAtChar(normalizeSpeechText(spoken), charIndex),
        speechWordCount(spoken),
      );
      if (word === null) return;

      let at = 0;
      for (let i = 0; i < offsets.length; i += 1) {
        if (offsets[i] <= word) at = i;
      }

      // Fokus ikut pindah bersama suara, jadi kalimat yang terang selalu yang dibacakan.
      setActiveUnit(at);
      setSpot({ unit: at, word: word - offsets[at], syllable: null });
    },
    [spoken, offsets],
  );

  const handleDone = useCallback(() => setSpot(null), []);

  useAutoSpeak(spoken, speechKey, true, handleBoundary, handleDone);

  const selectUnit = (index: number) => {
    if (index === unit) return;

    setActiveUnit(index);
    setRulerLine(0);
  };

  const spell = (index: number, word: number) => {
    const pieces = spellableWords(units[index], language)[word]?.pieces ?? [];

    selectUnit(index);
    speakSequence(
      pieces.map((piece) => syllableForSpeech(piece, language)),
      spellKey,
      {
        onPart: (syllable) => setSpot({ unit: index, word, syllable }),
        onDone: () => setSpot(null),
      },
    );
  };

  const handleWordPress = (index: number, word: number) => {
    if (spelling) {
      spell(index, word);
      return;
    }

    if (index !== unit) {
      selectUnit(index);
      return;
    }

    if (rulerMode) setRulerLine(lineOfWord(word));
  };

  const syncLines = (next: TextLayoutLine[]) => {
    const measured = next.map((line) => ({
      y: line.y,
      height: line.height,
      words: line.text.split(/\s+/).filter((word) => word.length > 0).length,
    }));

    // onTextLayout datang tiap render dengan array baru; simpan hanya kalau berubah.
    setLines((previous) =>
      previous.length === measured.length &&
      previous.every(
        (line, i) =>
          line.y === measured[i].y &&
          line.height === measured[i].height &&
          line.words === measured[i].words,
      )
        ? previous
        : measured,
    );
  };

  const moveRuler = (delta: number) => {
    if (lines.length === 0) return;

    setRulerLine(Math.min(Math.max(shownRulerLine + delta, 0), lines.length - 1));
  };

  const hint = spelling
    ? t.reader.spellTapHint
    : rulerMode
      ? t.explain.rulerTapHint
      : focusMode && units.length > 1
        ? t.explain.focusTapHint
        : null;

  return (
    <>
      <LexiBubble>
        {units.map((text, index) => {
          const isActive = index === unit;
          const showRuler = isActive && band !== undefined;
          const here = shownSpot && shownSpot.unit === index ? shownSpot : null;

          return (
            <View
              key={index}
              className={index < units.length - 1 ? (focusMode ? 'mb-2' : 'mb-4') : ''}>
              {showRuler && band ? (
                <View
                  pointerEvents="none"
                  className="absolute left-0 right-0 rounded-md bg-highlight"
                  style={{ top: band.y, height: band.height }}
                />
              ) : null}
              {/*
                Teks redup tetap bisa diketuk: di sinilah satu-satunya cara
                memindah fokus ke kalimat lain tanpa suara.
              */}
              <DyslexicText
                bicolor={bicolorMode}
                dimmed={focusMode && units.length > 1 && !isActive}
                activeWordIndex={here?.word ?? null}
                activeSyllableIndex={here?.syllable ?? null}
                rulerLineIndex={showRuler ? shownRulerLine : null}
                onWordPress={(_, word) => handleWordPress(index, word)}
                onTextLayout={isActive ? (event) => syncLines(event.nativeEvent.lines) : undefined}>
                {text}
              </DyslexicText>
            </View>
          );
        })}

        {spoken.length > 0 ? (
          <View className="mt-3 flex-row items-center" style={{ gap: 10 }}>
            <SpeakButton
              text={spoken}
              speechKey={speechKey}
              size={16}
              onBoundary={handleBoundary}
              onDone={handleDone}
            />
            <View className="flex-1">
              <FootprintChip />
            </View>
          </View>
        ) : (
          <FootprintChip />
        )}
      </LexiBubble>

      <View className="mt-4 flex-row flex-wrap justify-center" style={{ gap: 8 }}>
        <FeatureChip
          compact
          active={focusMode}
          onPress={() => {
            toggleFocusMode();
            // Satuannya berganti antara paragraf dan kalimat; nomor lamanya tidak berarti lagi.
            setActiveUnit(0);
            setRulerLine(0);
          }}
          icon={<Focus size={16} color={focusMode ? '#ffffff' : colors.textMuted} />}
          label={t.reader.focus}
        />
        <FeatureChip
          compact
          active={rulerMode}
          onPress={toggleRulerMode}
          icon={<Ruler size={16} color={rulerMode ? '#ffffff' : colors.textMuted} />}
          label={t.reader.ruler}
        />
        <FeatureChip
          compact
          active={bicolorMode}
          onPress={toggleBicolorMode}
          icon={<Palette size={16} color={bicolorMode ? '#ffffff' : colors.textMuted} />}
          label={t.reader.bicolor}
        />
        <FeatureChip
          compact
          active={syllableSpacing}
          onPress={() => {
            const next = !syllableSpacing;
            setSyllableSpacing(next);
            void pushPreference({ syllable_spacing: next });
          }}
          icon={<WholeWord size={16} color={syllableSpacing ? '#ffffff' : colors.textMuted} />}
          label={t.reader.syllables}
        />
        {ttsEnabled ? (
          <FeatureChip
            compact
            active={spellMode}
            onPress={() => {
              if (voiceActive) stop();
              setSpellMode((value) => !value);
            }}
            icon={<AudioLines size={16} color={spellMode ? '#ffffff' : colors.textMuted} />}
            label={t.reader.spell}
            accessibilityLabel={t.reader.spellLabel}
          />
        ) : null}
      </View>

      {hint ? (
        <View
          className="mt-3 min-h-11 flex-row items-center rounded-[14px] bg-primary/[0.04] px-3"
          style={{ gap: 8 }}>
          <Lightbulb size={14} color={colors.textMuted} />
          <Text className="flex-1 py-2 font-ui-medium text-xs text-text-muted">{hint}</Text>
          {rulerMode && !spelling ? (
            <>
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
            </>
          ) : null}
        </View>
      ) : null}
    </>
  );
}
