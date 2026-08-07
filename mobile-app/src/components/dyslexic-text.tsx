import { Text, type TextLayoutEventData, type NativeSyntheticEvent } from 'react-native';

import { getTypeLevel, type TypeLevel } from '../theme/palettes';
import { useOCRStore } from '../store/useStore';
import { useThemeColors } from '../theme/theme-provider';

type Props = {
  children: string;
  /** Bicolor Words: warna bergantian per kata supaya mata tidak kehilangan baris. */
  bicolor?: boolean;
  /** Diredupkan saat paragraf lain sedang aktif di Mode Fokus. */
  dimmed?: boolean;
  onWordPress?: (word: string) => void;
  /** Timpa preset tipografi aktif — dipakai kartu pratinjau di Pengaturan. */
  levelOverride?: TypeLevel;
  /** Posisi tiap baris hasil layout — dipakai Reading Ruler untuk menempatkan penggaris. */
  onTextLayout?: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
};

/** Hanya huruf/angka — tanda baca dibuang agar sheet suku kata tidak ikut kebawa. */
const stripPunctuation = (word: string) => word.replace(/[^\p{L}\p{N}-]/gu, '');

/**
 * Pecah paragraf jadi potongan kata + spasi, sambil menomori kata (spasi tidak
 * dihitung). Nomor inilah yang menentukan giliran warna pada Bicolor Words.
 */
function toChunks(text: string) {
  let counter = 0;

  return text
    .split(/(\s+)/)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const isSpace = /^\s+$/.test(chunk);
      const entry = { chunk, isSpace, wordIndex: counter };
      if (!isSpace) counter += 1;
      return entry;
    });
}

/**
 * Satu paragraf teks bacaan dengan aturan tipografi dari Figma:
 *
 * - Atkinson Hyperlegible, line-height lega (1.85–2.4×), letter spacing renggang.
 * - Visual fixation: huruf pertama tiap kata Bold, sisanya Regular. Hanya aktif
 *   di preset Sedang & Berat.
 * - Bicolor Words: kata ganjil/genap berganti warna (bicolorA / bicolorB).
 */
export function DyslexicText({
  children,
  bicolor,
  dimmed,
  onWordPress,
  levelOverride,
  onTextLayout,
}: Props) {
  const typeLevelId = useOCRStore((s) => s.typeLevelId);
  const level = levelOverride ?? getTypeLevel(typeLevelId);
  const colors = useThemeColors();

  const chunks = toChunks(children);

  return (
    <Text
      className="font-read"
      onTextLayout={onTextLayout}
      style={{
        fontSize: level.fontSize,
        lineHeight: level.fontSize * level.lineHeightRatio,
        letterSpacing: level.letterSpacing,
        color: dimmed ? colors.textMuted : colors.textMain,
        opacity: dimmed ? 0.35 : 1,
      }}>
      {chunks.map(({ chunk, isSpace, wordIndex }, index) => {
        if (isSpace) return <Text key={index}> </Text>;

        const color = dimmed
          ? undefined
          : bicolor
            ? wordIndex % 2 === 0
              ? colors.bicolorA
              : colors.bicolorB
            : undefined;

        const press = onWordPress ? () => onWordPress(stripPunctuation(chunk)) : undefined;

        if (!level.bodyBold) {
          return (
            <Text key={index} style={color ? { color } : undefined} onPress={press}>
              {chunk}
            </Text>
          );
        }

        return (
          <Text key={index} style={color ? { color } : undefined} onPress={press}>
            <Text className="font-read-bold">{chunk.slice(0, 1)}</Text>
            <Text>{chunk.slice(1)}</Text>
          </Text>
        );
      })}
    </Text>
  );
}
