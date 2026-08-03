import { type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const SPRING = { damping: 18, stiffness: 320, mass: 0.5 } as const;

type Props = Omit<PressableProps, 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Gaya pembungkus — perlu diisi `{ flex: 1 }` saat tombol berada di baris flex. */
  wrapperStyle?: StyleProp<ViewStyle>;
  scaleTo?: number;
};

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
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

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
