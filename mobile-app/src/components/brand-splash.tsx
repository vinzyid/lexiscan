import { useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useT } from '../i18n';
import { Blob, HexDecor, Sparkle } from './figma-decor';
import { LexiMascot } from './illustrations';

/**
 * Frame "SplashScreen" di Figma (node 76:406). Kanvas 390x844: posisi dipakai
 * sebagai rasio, ukuran benda tetap piksel.
 */

const BACKDROP = {
  colors: ['#2e0759', '#4c1d95', '#5b21b6', '#7c3aed', '#a78bfa'] as const,
  locations: [0.0849, 0.3339, 0.5415, 0.7491, 0.9151] as const,
};

/** Cincin sepusat di belakang maskot. */
const HALO_RINGS = [
  { size: 332.6, border: 1.04, stroke: 0.04, opacity: 0.8 },
  { size: 225, border: 1.02, stroke: 0.07, opacity: 0.63 },
  { size: 140.4, border: 1.0, stroke: 0.09, opacity: 0.43 },
];

/** Posisi kilau sebagai rasio kanvas Figma 390x844. */
const SPARKLES = [
  { x: 55.96 / 390, y: 237.68 / 844, size: 10.3, opacity: 0.47 },
  { x: 343.86 / 390, y: 464.86 / 844, size: 9.7, opacity: 0.7 },
  { x: 40.08 / 390, y: 524.35 / 844, size: 5.8, opacity: 0.33 },
  { x: 281.21 / 390, y: 658.72 / 844, size: 9.2, opacity: 0.8 },
  { x: 93.59 / 390, y: 675.19 / 844, size: 7, opacity: 0.55 },
  { x: 196.14 / 390, y: 127.73 / 844, size: 6.7, opacity: 0.37 },
];

const HOLD_MS = 2300;
const PROGRESS_MS = 1900;

export function BrandSplash({ onDone }: { onDone: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const halo = useSharedValue(0);
  const mascot = useSharedValue(0);
  const title = useSharedValue(0);
  const tagline = useSharedValue(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    halo.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    mascot.value = withDelay(120, withSpring(1, { damping: 14, stiffness: 140, mass: 0.9 }));
    title.value = withDelay(380, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    tagline.value = withDelay(
      520,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
    progress.value = withDelay(
      200,
      withTiming(1, { duration: PROGRESS_MS, easing: Easing.inOut(Easing.quad) }),
    );

    const timer = setTimeout(onDone, HOLD_MS);
    return () => clearTimeout(timer);
  }, [halo, mascot, title, tagline, progress, onDone]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value,
    transform: [{ scale: 0.88 + halo.value * 0.12 }],
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    opacity: mascot.value,
    transform: [{ scale: 0.72 + mascot.value * 0.28 }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: (1 - title.value) * 14 }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: tagline.value,
    transform: [{ translateY: (1 - tagline.value) * 10 }],
  }));

  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const barWidth = Math.min(310, width - 80);

  return (
    <Pressable
      onPress={onDone}
      accessibilityRole="button"
      accessibilityLabel={`${t.splash.loadingLabel}. ${t.splash.skipHint}`}
      style={{ flex: 1 }}>
      <LinearGradient
        colors={[...BACKDROP.colors]}
        locations={[...BACKDROP.locations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, overflow: 'hidden' }}>
        <Blob size={160} opacity={0.07} style={{ position: 'absolute', top: -40, right: -45 }} />
        <Blob size={130} opacity={0.06} style={{ position: 'absolute', bottom: -35, left: -38 }} />
        <HexDecor size={28} opacity={0.1} style={{ position: 'absolute', top: 101, left: 39 }} />
        <HexDecor size={20} opacity={0.1} style={{ position: 'absolute', top: 152, right: 31 }} />
        <HexDecor size={18} opacity={0.1} style={{ position: 'absolute', bottom: 168, right: 47 }} />

        {SPARKLES.map((sparkle, index) => (
          <Sparkle
            key={index}
            size={sparkle.size}
            opacity={sparkle.opacity}
            style={{
              position: 'absolute',
              left: sparkle.x * width,
              top: sparkle.y * height,
            }}
          />
        ))}

        <View className="flex-1 items-center justify-center px-8" style={{ paddingBottom: 90 }}>
          <View className="items-center justify-center">
            <Animated.View
              pointerEvents="none"
              style={[{ position: 'absolute', alignItems: 'center' }, haloStyle]}>
              <Glow size={300} />
              {HALO_RINGS.map((ring) => (
                <View
                  key={ring.size}
                  style={{
                    position: 'absolute',
                    width: ring.size,
                    height: ring.size,
                    marginTop: -ring.size / 2,
                    borderRadius: ring.size / 2,
                    borderWidth: ring.border,
                    borderColor: `rgba(255,255,255,${ring.stroke})`,
                    opacity: ring.opacity,
                  }}
                />
              ))}
            </Animated.View>

            <Animated.View style={mascotStyle}>
              <LexiMascot size={128} />
            </Animated.View>
          </View>

          <Animated.View style={titleStyle} className="mt-5 items-center">
            <Text
              className="font-ui-bold text-white"
              style={{ fontSize: 40, lineHeight: 46, letterSpacing: -0.4 }}>
              {t.splash.title}
            </Text>
          </Animated.View>

          <Animated.View style={taglineStyle} className="mt-2.5 items-center">
            <Text
              className="font-ui-medium text-center"
              style={{ fontSize: 16, lineHeight: 22.4, color: 'rgba(255,255,255,0.65)' }}>
              {t.splash.tagline}
            </Text>
            <Text
              className="mt-0.5 font-ui-medium text-center"
              style={{ fontSize: 13, lineHeight: 18.2, color: 'rgba(255,255,255,0.4)' }}>
              {t.splash.subTagline}
            </Text>

            <View
              className="mt-[22px] flex-row flex-wrap items-center justify-center"
              style={{ gap: 8, maxWidth: 326 }}>
              {t.splash.chips.map((chip, index) => (
                <FeatureChip key={chip} label={chip} index={index} />
              ))}
            </View>
          </Animated.View>
        </View>

        <View
          className="items-center px-10"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + 28 }}>
          <View
            className="overflow-hidden rounded-sm"
            style={{ width: barWidth, height: 3, backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <Animated.View style={progressStyle}>
              <LinearGradient
                colors={['rgba(255,255,255,0.6)', '#ffffff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 3,
                  borderRadius: 2,
                  shadowColor: '#ffffff',
                  shadowOpacity: 0.6,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                }}
              />
            </Animated.View>
          </View>

          <Text
            className="mt-4 font-ui-semibold"
            style={{
              fontSize: 11,
              lineHeight: 16.5,
              letterSpacing: 0.77,
              color: 'rgba(255,255,255,0.28)',
            }}>
            {t.splash.footer}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/**
 * Di Figma keempat chip diposisikan absolut; di sini flex-wrap supaya baris
 * kedua terbentuk sendiri saat label terjemahan lebih panjang.
 */
function FeatureChip({ label, index }: { label: string; index: number }) {
  const appear = useSharedValue(0);

  useEffect(() => {
    appear.value = withDelay(
      680 + index * 90,
      withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }),
    );
  }, [appear, index]);

  const style = useAnimatedStyle(() => ({
    opacity: appear.value,
    transform: [{ scale: 0.9 + appear.value * 0.1 }],
  }));

  return (
    <Animated.View
      style={[
        {
          height: 29,
          justifyContent: 'center',
          paddingHorizontal: 12,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.18)',
          backgroundColor: 'rgba(255,255,255,0.11)',
        },
        style,
      ]}>
      <Text
        className="font-ui-bold"
        style={{ fontSize: 11, lineHeight: 16.5, color: 'rgba(255,255,255,0.78)' }}>
        {label}
      </Text>
    </Animated.View>
  );
}

/** Gradien radial Figma ditiru dengan lingkaran bertumpuk (RN tidak punya radial). */
function Glow({ size }: { size: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', marginTop: -size / 2 }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx="50" cy="50" r="50" fill="#a78bfa" fillOpacity={0.06} />
        <Circle cx="50" cy="50" r="34" fill="#a78bfa" fillOpacity={0.09} />
        <Circle cx="50" cy="50" r="20" fill="#a78bfa" fillOpacity={0.12} />
      </Svg>
    </View>
  );
}
