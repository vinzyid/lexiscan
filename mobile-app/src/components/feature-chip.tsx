import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { GRADIENTS } from '../theme/palettes';
import { PressableScale } from './pressable-scale';
import { TourTarget } from './spotlight-tour';

/**
 * Sakelar alat baca (Fokus, Penggaris, Dua Warna, Su-ku, Eja).
 *
 * Dipakai layar Baca dan jawaban Tanya Lexi. Bentuknya harus sama di
 * keduanya: anak yang sudah mengenal tombolnya di layar Baca tidak perlu
 * belajar tombol baru hanya karena teksnya datang dari Lexi.
 */
export function FeatureChip({
  active,
  onPress,
  icon,
  label,
  accessibilityLabel,
  compact,
  tourId,
}: {
  active: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  /** Nama yang dibacakan, kalau label di layar terlalu singkat untuk menjelaskannya. */
  accessibilityLabel?: string;
  /** Selebar isinya saja, tidak ikut membagi rata baris. */
  compact?: boolean;
  /** Sasaran tur pendamping. */
  tourId?: string;
}) {
  const content = (
    <>
      {icon}
      <Text className={`font-ui-bold text-xs ${active ? 'text-white' : 'text-text-muted'}`}>
        {label}
      </Text>
    </>
  );

  /*
   * Lebar dibagi rata oleh pembungkus sasaran tur, bukan oleh tombolnya, supaya
   * sorotan tur pas dengan tombol yang terlihat.
   */
  return (
    <TourTarget id={tourId} style={compact ? undefined : { flex: 1 }}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="switch"
        accessibilityState={{ checked: active }}
        accessibilityLabel={accessibilityLabel ?? label}
        scaleTo={0.93}>
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
              paddingHorizontal: compact ? 12 : 8,
              borderRadius: 16,
            }}>
            {content}
          </LinearGradient>
        ) : (
          <View
            className={`h-11 flex-row items-center justify-center rounded-[16px] bg-primary/[0.07] ${
              compact ? 'px-3' : 'px-2'
            }`}
            style={{ gap: 6 }}>
            {content}
          </View>
        )}
      </PressableScale>
    </TourTarget>
  );
}
