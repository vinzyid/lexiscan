import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check } from 'lucide-react-native';

import { useT } from '../i18n';
import { GRADIENTS } from '../theme/palettes';
import { READING_LEVELS, type ReadingLevelId } from '../theme/reading-levels';
import { PressableScale } from './pressable-scale';
import { SpeakButton } from './speak-button';

type Props = {
  value: ReadingLevelId | null;
  onChange: (id: ReadingLevelId) => void;
};

/**
 * Pemilih kemampuan membaca — pertanyaan terpenting di seluruh pendaftaran.
 *
 * Tiap kartu memperlihatkan CONTOH bentuk teks yang akan didapat ("Ma ta ha ri"
 * lawan "Matahari"), bukan hanya menjelaskannya dengan kata-kata. Orang yang
 * paling perlu menjawab pertanyaan ini adalah orang yang paling mungkin tidak
 * bisa membaca pilihannya, jadi jawabannya harus bisa dilihat dan didengar,
 * bukan cuma dibaca.
 */
export function ReadingLevelPicker({ value, onChange }: Props) {
  const t = useT();

  return (
    <View style={{ gap: 10 }}>
      {READING_LEVELS.map((level) => {
        const copy = t.readingLevels[level.id];
        const selected = level.id === value;

        return (
          <PressableScale
            key={level.id}
            onPress={() => onChange(level.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`${copy.name}. ${copy.desc}`}
            scaleTo={0.98}
            className={`rounded-2xl border p-4 ${
              selected ? 'border-primary/30 bg-primary/[0.08]' : 'border-border/10 bg-surface'
            }`}>
            <View className="flex-row items-center" style={{ gap: 10 }}>
              {selected ? (
                <LinearGradient
                  colors={[...GRADIENTS.activePill.colors]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Check size={12} color="#ffffff" strokeWidth={3} />
                </LinearGradient>
              ) : (
                <View className="h-[22px] w-[22px] rounded-full border-2 border-border/20" />
              )}

              <Text
                className={`flex-1 font-ui-bold text-[15px] ${
                  selected ? 'text-primary' : 'text-text-main'
                }`}>
                {copy.name}
              </Text>

              <SpeakButton
                text={`${copy.name}. ${copy.desc}`}
                speechKey={`reading-level:${level.id}`}
                size={16}
              />
            </View>

            <Text className="mt-2 font-ui-medium text-[13px] leading-5 text-text-muted">
              {copy.desc}
            </Text>

            {/* Contoh tampilannya, ditulis dengan font bacaan supaya bedanya
                terlihat persis seperti nanti di layar Baca. */}
            <View className="mt-3 rounded-xl bg-surface-alt px-3 py-2.5">
              <Text
                className="font-read text-text-main"
                style={{ fontSize: 20, letterSpacing: 1.1 }}>
                {copy.example}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
