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
 * Satu paragraf dengan aturan tipografi disleksia: line-height lega, letter
 * spacing renggang, dan penebalan awal kata (visual fixation) pada preset
 * Sedang & Berat.
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

  const words = children.split(/(\s+)/).filter((chunk) => chunk.length > 0);

  return (
    <Text
      className="font-opendyslexic"
      onTextLayout={onTextLayout}
      style={{
        fontSize: level.fontSize,
        lineHeight: level.fontSize * level.lineHeightRatio,
        letterSpacing: level.letterSpacing,
        color: dimmed ? colors.textMuted : colors.textMain,
        opacity: dimmed ? 0.35 : 1,
      }}>
      {words.map((chunk, index) => {
        if (/^\s+$/.test(chunk)) return <Text key={index}> </Text>;

        const wordIndex = words.slice(0, index).filter((c) => !/^\s+$/.test(c)).length;
        const color = dimmed
          ? undefined
          : bicolor
            ? wordIndex % 2 === 0
              ? colors.bicolorA
              : colors.bicolorB
            : undefined;

        if (!level.boldFixation) {
          return (
            <Text key={index} style={color ? { color } : undefined} onPress={onWordPress ? () => onWordPress(stripPunctuation(chunk)) : undefined}>
              {chunk}
            </Text>
          );
        }

        const split = Math.min(chunk.length, Math.max(1, Math.ceil(chunk.length / 2)));

        return (
          <Text
            key={index}
            style={color ? { color } : undefined}
            onPress={onWordPress ? () => onWordPress(stripPunctuation(chunk)) : undefined}>
            <Text className="font-bold">{chunk.slice(0, split)}</Text>
            <Text>{chunk.slice(split)}</Text>
          </Text>
        );
      })}
    </Text>
  );
}
