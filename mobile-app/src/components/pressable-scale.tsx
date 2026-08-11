import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useSpeakLabel } from '../speech/use-speech';

const SPRING = { damping: 18, stiffness: 320, mass: 0.5 } as const;

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Gaya pembungkus — perlu diisi `{ flex: 1 }` saat tombol berada di baris flex. */
  wrapperStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
  /**
   * Jangan bacakan nama tombol ini meski fiturnya menyala.
   *
   * Dipakai oleh tombol yang perbuatannya SUDAH berupa suara — `SpeakButton`
   * misalnya, yang kalau ikut akan menyebut "Bacakan teks ini" lalu langsung
   * memotongnya sendiri dengan teks yang diminta.
   */
  silent?: boolean;
};

/**
 * Batas panjang label yang masih dianggap nama tombol.
 *
 * Beberapa `accessibilityLabel` di aplikasi ini memuat seluruh isi kartunya —
 * judul, keterangan, dan contoh sekaligus — supaya pembaca layar menyampaikan
 * kartunya sebagai satu kesatuan. Membacakan yang sepanjang itu tiap kali
 * disentuh bukan bantuan, jadi yang melewati batas dilewati saja; kartu semacam
 * itu sudah punya tombol bacakannya sendiri.
 */
const MAX_LABEL_LENGTH = 90;

/**
 * Transform ditaruh di pembungkus, bukan di Pressable, supaya `className`
 * NativeWind tetap menempel di Pressable seperti markup sebelumnya.
 */
export function PressableScale({
  children,
  style,
  className,
  wrapperStyle,
  scaleTo = 0.96,
  silent,
  disabled,
  onPress,
  onPressIn,
  onPressOut,
  accessibilityLabel,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const speakLabel = useSpeakLabel();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[wrapperStyle, animatedStyle]}>
      <Pressable
        {...rest}
        disabled={disabled}
        className={className}
        style={style}
        accessibilityLabel={accessibilityLabel}
        /*
         * Dibacakan LEBIH DULU, baru perbuatannya dijalankan. Urutannya penting
         * saat tombolnya berpindah layar: `speak()` menghentikan ucapan
         * sebelumnya, jadi kalau perpindahan berjalan duluan, ucapan yang baru
         * dimulai justru yang ikut terpotong.
         */
        onPress={(event) => {
          if (!silent && accessibilityLabel && accessibilityLabel.length <= MAX_LABEL_LENGTH) {
            speakLabel(accessibilityLabel);
          }

          onPress?.(event);
        }}
        onPressIn={(event) => {
          scale.value = withSpring(scaleTo, SPRING);
          opacity.value = withTiming(0.85, { duration: 80 });
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.value = withSpring(1, SPRING);
          opacity.value = withTiming(1, { duration: 140 });
          onPressOut?.(event);
        }}>
        {children}
      </Pressable>
    </Animated.View>
  );
}
