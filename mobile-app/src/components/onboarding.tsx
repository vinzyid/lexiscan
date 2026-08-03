import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { SvgProps } from 'react-native-svg';
import { ArrowRight } from 'lucide-react-native';

import { useT } from '../i18n';
import { PressableScale } from './pressable-scale';
import { Blob, Sparkle } from './figma-decor';
import { LexiMascot } from './illustrations';

import IlluOnboard1 from '../../assets/figma/illu-onboard-1.svg';
import IlluOnboard2 from '../../assets/figma/illu-onboard-2.svg';
import IlluOnboard3 from '../../assets/figma/illu-onboard-3.svg';

/**
 * Frame "OnboardingScreen" di Figma (node 85:903 / 85:1983 / 85:2514). Di sana
 * tiga frame terpisah dengan tata letak identik; di sini satu komponen.
 */

type Slide = {
  accent: string;
  accentSoft: string;
  gradient: readonly [string, string, string, string];
  locations: readonly [number, number, number, number];
  Illu: React.FC<SvgProps>;
};

const SLIDES: Slide[] = [
  {
    accent: '#7c3aed',
    accentSoft: '#a78bfa',
    gradient: ['#2e0759', '#4c1d95', '#6d28d9', '#8b5cf6'],
    locations: [0.0849, 0.3755, 0.6245, 0.9151],
    Illu: IlluOnboard1,
  },
  {
    accent: '#10b981',
    accentSoft: '#6ee7b7',
    gradient: ['#064e3b', '#059669', '#10b981', '#34d399'],
    locations: [0.0849, 0.417, 0.6661, 0.9151],
    Illu: IlluOnboard2,
  },
  {
    accent: '#6366f1',
    accentSoft: '#c7d2fe',
    gradient: ['#1e1b4b', '#3730a3', '#4f46e5', '#818cf8'],
    locations: [0.0849, 0.3755, 0.6245, 0.9151],
    Illu: IlluOnboard3,
  },
];

/** Posisi kilau sebagai rasio kanvas Figma 390x844. */
const SPARKLES = [
  { x: 40.86 / 390, y: 153.76 / 844, size: 9.3, opacity: 0.29 },
  { x: 331.68 / 390, y: 101.45 / 844, size: 8.6, opacity: 0.9 },
  { x: 343.87 / 390, y: 355.15 / 844, size: 9.6, opacity: 0.69 },
  { x: 28.49 / 390, y: 423.2 / 844, size: 5.6, opacity: 0.25 },
  { x: 305.54 / 390, y: 507.74 / 844, size: 7.3, opacity: 0.32 },
];

const ILLU_WIDTH = 300;
const ILLU_HEIGHT = 260;

export function Onboarding({ onDone }: { onDone: () => void }) {
  const t = useT();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const total = SLIDES.length;

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(total - 1, Math.max(0, next));
      setStep(clamped);
      scrollRef.current?.scrollTo({ x: clamped * width, animated: true });
    },
    [total, width],
  );

  const advance = useCallback(() => {
    if (step >= total - 1) onDone();
    else goTo(step + 1);
  }, [step, total, goTo, onDone]);

  const slide = SLIDES[step];

  const illuScale = Math.min(1, (width - 90) / ILLU_WIDTH);

  return (
    <View className="flex-1">
      {/* Latar digambar sekali di luar pager: menggeser tiga gradien setinggi layar jauh lebih berat. */}
      <SlideBackdrop slide={slide} />

      <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
        <Blob size={130} opacity={0.07} style={{ position: 'absolute', top: -35, left: -35 }} />
        <Blob size={100} opacity={0.06} style={{ position: 'absolute', top: 484, right: -25 }} />
        {SPARKLES.map((sparkle, index) => (
          <Sparkle
            key={index}
            size={sparkle.size}
            opacity={sparkle.opacity}
            style={{ position: 'absolute', left: sparkle.x * width, top: `${sparkle.y * 100}%` }}
          />
        ))}
      </View>

      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View
            className="h-8 w-8 items-center justify-center rounded-[14px] border"
            style={{
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderColor: 'rgba(255,255,255,0.25)',
            }}>
            <LexiMascot size={22} />
          </View>
          <Text
            className="font-ui-bold text-white"
            style={{ fontSize: 17, lineHeight: 25.5, letterSpacing: -0.17 }}>
            LexiScan
          </Text>
        </View>

        <PressableScale
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={t.onboarding.skip}
          scaleTo={0.94}
          className="h-11 items-center justify-center rounded-[14px] border px-4"
          style={{
            backgroundColor: 'rgba(255,255,255,0.14)',
            borderColor: 'rgba(255,255,255,0.2)',
          }}>
          <Text
            className="font-ui-bold"
            style={{ fontSize: 13, lineHeight: 19.5, color: 'rgba(255,255,255,0.75)' }}>
            {t.onboarding.skip}
          </Text>
        </PressableScale>
      </View>

      <View
        className="mt-4 flex-row px-5"
        style={{ gap: 8 }}
        accessibilityRole="progressbar"
        accessibilityLabel={t.onboarding.stepOf(step + 1, total)}>
        {SLIDES.map((_, index) => (
          <StepBar key={index} filled={index <= step} />
        ))}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (next !== step) setStep(next);
        }}
        className="flex-1">
        {SLIDES.map(({ Illu }, index) => (
          <View key={index} style={{ width }} className="items-center justify-center">
            <View
              pointerEvents="none"
              className="absolute rounded-full"
              style={{
                width: 240,
                height: 240,
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}
            />
            <Illu width={ILLU_WIDTH * illuScale} height={ILLU_HEIGHT * illuScale} />
          </View>
        ))}
      </ScrollView>

      <View className="px-3" style={{ paddingBottom: Math.max(insets.bottom, 12) + 4 }}>
        <View
          className="overflow-hidden rounded-3xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.96)',
            shadowColor: '#000000',
            shadowOpacity: 0.18,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: -4 },
            elevation: 12,
          }}>
          <LinearGradient
            colors={[slide.accent, slide.accentSoft]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 3 }}
          />

          <View className="px-6 pb-6 pt-5">
            <View className="flex-row">
              <View
                className="flex-row items-center rounded-[14px] px-3 py-1"
                style={{ gap: 6, backgroundColor: withAlpha(slide.accent, 0.08) }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: slide.accent,
                  }}
                />
                <Text
                  className="font-ui-bold"
                  style={{
                    fontSize: 11,
                    lineHeight: 16.5,
                    letterSpacing: 0.66,
                    color: slide.accent,
                  }}>
                  {t.onboarding.slides[step].badge}
                </Text>
              </View>
            </View>

            <Text
              className="mt-3 font-ui-bold"
              style={{ fontSize: 27, lineHeight: 31.86, color: '#1c1c2e' }}>
              {t.onboarding.slides[step].title}
            </Text>

            <Text
              className="mt-2.5 font-ui"
              style={{ fontSize: 14, lineHeight: 23.8, color: '#6b7280' }}>
              {t.onboarding.slides[step].desc}
            </Text>

            <View className="mt-5 flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 8 }}>
                {SLIDES.map((_, index) => (
                  <PageDot key={index} active={index === step} accent={slide.accent} />
                ))}
              </View>

              <PressableScale
                onPress={advance}
                accessibilityRole="button"
                accessibilityLabel={step === total - 1 ? t.onboarding.start : t.onboarding.next}
                scaleTo={0.96}
                className="h-[49px] flex-row items-center justify-center rounded-2xl px-7"
                style={{
                  gap: 8,
                  backgroundColor: slide.accent,
                  shadowColor: slide.accent,
                  shadowOpacity: 0.33,
                  shadowRadius: 11,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}>
                <Text
                  className="font-ui-bold text-white"
                  style={{ fontSize: 15, lineHeight: 22.5 }}>
                  {step === total - 1 ? t.onboarding.start : t.onboarding.next}
                </Text>
                {step === total - 1 ? null : <ArrowRight size={16} color="#ffffff" />}
              </PressableScale>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function SlideBackdrop({ slide }: { slide: Slide }) {
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="none">
      <LinearGradient
        colors={[...slide.gradient]}
        locations={[...slide.locations]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
    </View>
  );
}

function StepBar({ filled }: { filled: boolean }) {
  const progress = useSharedValue(filled ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(filled ? 1 : 0, { duration: 280 });
  }, [filled, progress]);

  const style = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View
      className="h-[3px] flex-1 overflow-hidden rounded-full"
      style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
      <Animated.View
        style={[{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' }, style]}
      />
    </View>
  );
}

function PageDot({ active, accent }: { active: boolean; accent: string }) {
  return (
    <View
      style={{
        width: active ? 24 : 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: active ? accent : withAlpha(accent, 0.16),
      }}
    />
  );
}

/** `#rrggbb` + alpha → `rgba(...)`, karena RN tidak menerima hex 8 digit di semua platform. */
function withAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
