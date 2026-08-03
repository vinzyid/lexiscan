import { useEffect, useState } from 'react';
import { Animated, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
// `Animated` bawaan RN dipakai untuk tip harian, Reanimated untuk kartu fitur.
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { BookOpen, Camera, ChevronRight, Sparkles } from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { FEATURE_ACCENTS, GRADIENTS } from '../../src/theme/palettes';
import { useT } from '../../src/i18n';
import { PressableScale } from '../../src/components/pressable-scale';
import { TypographySheet } from '../../src/components/typography-sheet';
import { ExplainSheet } from '../../src/components/explain-sheet';
import { Blob, HexDecor, Ring, ScreenBackdrop, Sparkle, WaveCut } from '../../src/components/figma-decor';
import {
  ArtBicolorWords,
  ArtReadingRuler,
  ArtWordIsolation,
  IlluExplain,
  IlluFocus,
  IlluScan,
  IlluSimplify,
  IlluTypo,
  LexiMascot,
} from '../../src/components/illustrations';

/** Margin kiri/kanan halaman (Figma: kartu 358 pada kanvas 390). */
const PAGE_PADDING = 16;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const t = useT();

  const [typographyOpen, setTypographyOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const { focusMode, toggleFocusMode, typeLevelId, simplifyLevel } = useOCRStore();

  /** Lebar kartu sesungguhnya (Figma: 358 pada layar 390). */
  const cardWidth = width - PAGE_PADDING * 2;

  const [tipIndex, setTipIndex] = useState(0);
  const fade = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTipIndex((prev) => (prev + 1) % t.dailyTips.length);
        Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 6000);
    return () => clearInterval(timer);
  }, [fade, t.dailyTips.length]);

  /*
   * Dari dashboard belum ada dokumen yang dibuka, jadi sheet menjelaskan topik
   * dokumen contoh memakai jawaban kurasi (tanpa memanggil API).
   */
  const explainDemoTarget = { term: t.sampleDoc.term, useStaticAnswers: true };

  const features = [
    {
      accent: FEATURE_ACCENTS.scan,
      Illu: IlluScan,
      label: t.dashboard.features.scan.label,
      desc: t.dashboard.features.scan.desc,
      onPress: () => router.push('/scanner'),
    },
    {
      accent: FEATURE_ACCENTS.typography,
      Illu: IlluTypo,
      label: t.dashboard.features.typography.label,
      desc: t.dashboard.features.typography.desc,
      onPress: () => setTypographyOpen(true),
    },
    {
      accent: FEATURE_ACCENTS.simplify,
      Illu: IlluSimplify,
      label: t.dashboard.features.simplify.label,
      desc: t.dashboard.features.simplify.desc,
      onPress: () => router.push('/reader'),
    },
    {
      accent: FEATURE_ACCENTS.focus,
      Illu: IlluFocus,
      label: t.dashboard.features.focus.label,
      desc: t.dashboard.features.focus.desc,
      onPress: () => {
        if (!focusMode) toggleFocusMode();
        router.push('/reader');
      },
    },
    {
      accent: FEATURE_ACCENTS.explain,
      Illu: IlluExplain,
      label: t.dashboard.features.explain.label,
      desc: t.dashboard.features.explain.desc,
      onPress: () => setExplainOpen(true),
    },
  ];

  const today = new Date().toLocaleDateString(t.locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <View className="flex-1 bg-background">
        <ScreenBackdrop />

        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          {/* ── Sapaan + avatar ─────────────────────────────────────────── */}
          <View className="flex-row items-center justify-between px-5 pb-4">
            <View>
              <Text className="font-ui-medium text-[13px] text-text-muted">{today}</Text>
              <Text className="font-ui-bold text-[22px] leading-[33px] text-text-main">
                {t.dashboard.greeting}
              </Text>
            </View>
            <LinearGradient
              colors={[...GRADIENTS.avatar.colors]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text className="font-ui-bold text-base text-white">R</Text>
            </LinearGradient>
          </View>

          {/* ── Banner utama ────────────────────────────────────────────── */}
          <View className="px-4">
            <LinearGradient
              colors={[...GRADIENTS.hero.colors]}
              locations={[...GRADIENTS.hero.locations]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderRadius: 24, overflow: 'hidden' }}>
              {/* Hiasan latar banner */}
              <Ring size={110} style={{ position: 'absolute', top: -18, right: 4 }} />
              <Blob size={110} style={{ position: 'absolute', top: -30, right: -6 }} />
              <Blob size={80} opacity={0.04} style={{ position: 'absolute', bottom: 8, left: -20 }} />
              <HexDecor size={36} style={{ position: 'absolute', top: 38, left: 197 }} />
              <HexDecor size={24} opacity={0.08} style={{ position: 'absolute', bottom: 30, left: 234 }} />
              <Sparkle size={10} style={{ position: 'absolute', top: 19, right: 100 }} />
              <Sparkle size={8} style={{ position: 'absolute', top: 80, right: 44 }} />
              <Sparkle size={7} style={{ position: 'absolute', bottom: 22, left: 222 }} />

              {/* Lexi di kanan, sedikit di atas kaki banner (Figma: x=230, y=62) */}
              <View style={{ position: 'absolute', right: 8, bottom: 28 }}>
                <LexiMascot size={120} />
              </View>

              {/* Chip status di kanan atas — urutan Figma: Sedang lalu L3 AI */}
              <View className="absolute right-4 top-[11px] flex-row" style={{ gap: 6 }}>
                <GlassChip subtle>
                  <Text className="font-ui-semibold text-xs text-white/75">{t.typeLevels[typeLevelId].name}</Text>
                </GlassChip>
                <GlassChip>
                  <Sparkles size={11} color="#fcd34d" fill="#fcd34d" />
                  <Text className="font-ui-bold text-xs text-white/90">
                    {t.simplifyLevels[simplifyLevel].short}
                  </Text>
                </GlassChip>
              </View>

              <View className="p-5" style={{ width: cardWidth * 0.62 }}>
                <View className="mb-[15px] flex-row">
                  <View
                    className="flex-row items-center rounded-[14px] border border-white/20 bg-white/10 px-2.5 py-1"
                    style={{ gap: 6 }}>
                    <View className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                    <Text className="font-ui-bold text-xs text-white/80">{t.dashboard.statusBadge}</Text>
                  </View>
                </View>

                <Text className="font-ui-bold text-[26px] leading-[30px] text-white">
                  {t.dashboard.heroTitle}
                </Text>

                <View className="mt-[22px] flex-row" style={{ gap: 8 }}>
                  <PressableScale
                    onPress={() => router.push('/scanner')}
                    accessibilityRole="button"
                    accessibilityLabel={t.dashboard.scanButtonLabel}
                    className="h-11 flex-row items-center rounded-2xl bg-white px-4"
                    style={{ gap: 6 }}>
                    <Camera size={16} color="#6d28d9" />
                    <Text className="font-ui-bold text-sm text-[#6d28d9]">{t.dashboard.scanButton}</Text>
                  </PressableScale>
                  <PressableScale
                    onPress={() => router.push('/reader')}
                    accessibilityRole="button"
                    accessibilityLabel={t.dashboard.readButtonLabel}
                    className="h-11 flex-row items-center rounded-2xl border border-white/25 bg-white/[0.14] px-4"
                    style={{ gap: 6 }}>
                    <BookOpen size={16} color="#ffffff" />
                    <Text className="font-ui-bold text-sm text-white">{t.dashboard.readButton}</Text>
                  </PressableScale>
                </View>
              </View>

              {/* Gelombang sewarna latar yang menutup kaki banner */}
              <WaveCut width={cardWidth} color={colors.background} />
            </LinearGradient>
          </View>

          {/* ── 5 fitur utama ───────────────────────────────────────────── */}
          <View className="flex-row items-end justify-between px-4 pb-3 pt-5">
            <View>
              <Text className="font-ui-bold text-xs text-text-muted">{t.dashboard.featuresEyebrow}</Text>
              <Text className="font-ui-bold text-[17px] text-text-main">
                {t.dashboard.featuresTitle}
              </Text>
            </View>
            <View className="rounded-[14px] bg-primary/[0.09] px-3 py-1.5">
              <Text className="font-ui-bold text-[13px] text-primary">{t.common.free}</Text>
            </View>
          </View>

          <View className="px-4" style={{ gap: 10 }}>
            {features.map(({ accent, Illu, label, desc, onPress }, index) => (
              <FeatureCard
                key={label}
                index={index}
                accent={accent}
                Illu={Illu}
                label={label}
                desc={desc}
                onPress={onPress}
              />
            ))}
          </View>

          {/* ── Inovasi eksklusif ───────────────────────────────────────── */}
          <View className="px-4 pb-3 pt-6">
            <Text className="font-ui-bold text-xs text-text-muted">{t.dashboard.innovationEyebrow}</Text>
            <Text className="font-ui-bold text-[17px] text-text-main">{t.dashboard.innovationTitle}</Text>
          </View>

          {/* Kata Dua Warna — kartu lebar */}
          <View className="px-4">
            <PressableScale
              onPress={() => router.push('/reader')}
              accessibilityRole="button"
              accessibilityLabel={t.dashboard.innovations.bicolor.label}
              scaleTo={0.98}>
              <LinearGradient
                colors={[...GRADIENTS.brand.colors]}
                locations={[...GRADIENTS.brand.locations]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ borderRadius: 16, overflow: 'hidden' }}>
                <View className="h-[78px] justify-center">
                  <Blob size={90} opacity={0.05} style={{ position: 'absolute', top: -24, right: 8 }} />
                  <HexDecor size={26} opacity={0.14} style={{ position: 'absolute', top: 8, left: 29 }} />
                  <View className="px-[18px]">
                    <ArtBicolorWords width={cardWidth - 36} />
                  </View>
                </View>
                <View className="border-t border-white/10 bg-black/20 px-3.5 py-3">
                  <Text className="font-ui-bold text-[15px] leading-5 text-white">
                    {t.dashboard.innovations.bicolor.title}
                  </Text>
                  <Text className="mt-0.5 font-ui-medium text-[13px] leading-[19px] text-white/70">
                    {t.dashboard.innovations.bicolor.desc}
                  </Text>
                </View>
              </LinearGradient>
            </PressableScale>
          </View>

          {/* Penggaris Baca + Sorot Kata */}
          <View className="flex-row px-4 pt-3" style={{ gap: 10 }}>
            <InnovationTile
              gradient={GRADIENTS.ruler}
              title={t.dashboard.innovations.ruler.title}
              desc={t.dashboard.innovations.ruler.desc}
              onPress={() => router.push('/reader')}
              art={<ArtReadingRuler width={90} />}
            />
            <InnovationTile
              gradient={GRADIENTS.isolation}
              title={t.dashboard.innovations.isolation.title}
              desc={t.dashboard.innovations.isolation.desc}
              onPress={() => router.push('/reader')}
              art={<ArtWordIsolation size={70} />}
            />
          </View>

          {/* ── Tip hari ini ────────────────────────────────────────────── */}
          <View className="px-4 pt-6">
            <View className="overflow-hidden rounded-2xl border border-border/10 bg-surface">
              <LinearGradient
                colors={[...GRADIENTS.brand.colors]}
                locations={[...GRADIENTS.brand.locations]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 35,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}>
                <Sparkle size={10} opacity={0.85} />
                <Text className="font-ui-bold text-xs text-white/95">{t.dashboard.tipOfDay}</Text>
                <Sparkle size={10} opacity={0.85} />
              </LinearGradient>

              <View className="flex-row items-center p-4" style={{ gap: 12 }}>
                <View className="h-9 w-9 items-center justify-center rounded-[14px] bg-primary/[0.09]">
                  <TipLines color={colors.primary} />
                </View>
                <Animated.Text
                  style={{ opacity: fade }}
                  className="flex-1 font-ui text-[14px] leading-[23px] text-text-main">
                  {t.dailyTips[tipIndex]}
                </Animated.Text>

              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      <TypographySheet visible={typographyOpen} onClose={() => setTypographyOpen(false)} />
      <ExplainSheet
        target={explainOpen ? explainDemoTarget : null}
        onClose={() => setExplainOpen(false)}
      />
    </>
  );
}

/** Chip kaca di atas gradien banner (Figma: bg putih 12%, garis putih 18%). */
function GlassChip({ children, subtle }: { children: React.ReactNode; subtle?: boolean }) {
  return (
    <View
      className={`h-[31px] flex-row items-center rounded-[14px] px-2.5 ${
        subtle ? 'border border-white/[0.12] bg-white/[0.09]' : 'border border-white/[0.18] bg-white/[0.12]'
      }`}
      style={{ gap: 6 }}>
      {children}
    </View>
  );
}

/** Kartu fitur yang naik satu per satu saat dashboard dibuka. */
function FeatureCard({
  index,
  accent,
  Illu,
  label,
  desc,
  onPress,
}: {
  index: number;
  accent: { gradient: readonly [string, string]; chevron: string };
  Illu: (props: { size?: number }) => React.ReactElement;
  label: string;
  desc: string;
  onPress: () => void;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      120 + index * 70,
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
    );
  }, [index, progress]);

  const entrance = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));

  return (
    <Reanimated.View style={entrance}>
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}. ${desc}`}
        scaleTo={0.98}
        className="h-[84px] flex-row items-center rounded-2xl bg-surface px-3.5"
        style={{ gap: 14 }}>
        <LinearGradient
          colors={[...accent.gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Illu size={37} />
        </LinearGradient>

        <View className="flex-1">
          <Text className="font-ui-bold text-[15px] leading-[21px] text-text-main">{label}</Text>
          <Text className="mt-0.5 font-ui-medium text-[13px] leading-[19px] text-text-muted">
            {desc}
          </Text>
        </View>

        <View
          className="h-8 w-8 items-center justify-center rounded-[16px]"
          style={{ backgroundColor: accent.chevron }}>
          <ChevronRight size={15} color="#ffffff" />
        </View>
      </PressableScale>
    </Reanimated.View>
  );
}

/** Kartu inovasi setengah lebar (Figma: 174x138). */
function InnovationTile({
  gradient,
  title,
  desc,
  art,
  onPress,
}: {
  gradient: { colors: readonly string[]; locations: readonly number[] };
  title: string;
  desc: string;
  art: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <PressableScale
      wrapperStyle={{ flex: 1 }}
      className="flex-1"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${desc}`}
      scaleTo={0.97}>
      <LinearGradient
        colors={[...gradient.colors] as [string, string, ...string[]]}
        locations={[...gradient.locations] as [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, overflow: 'hidden' }}>
        <View className="h-20 items-center justify-center">
          <Blob size={70} opacity={0.08} style={{ position: 'absolute', top: -18, right: -12 }} />
          {art}
        </View>
        <View className="border-t border-white/10 bg-black/20 px-3 py-3">
          <Text className="font-ui-bold text-[15px] leading-5 text-white">{title}</Text>
          <Text className="mt-0.5 font-ui-medium text-xs leading-[17px] text-white/65">{desc}</Text>
        </View>
      </LinearGradient>
    </PressableScale>
  );
}

/** Tiga garis miring kecil di ubin tip (Figma: tiga VECTOR bergaris primary). */
function TipLines({ color }: { color: string }) {
  return (
    <View style={{ width: 17, gap: 3 }}>
      <View style={{ height: 1.3, width: 13, borderRadius: 1, backgroundColor: color }} />
      <View style={{ height: 1.3, width: 9, borderRadius: 1, backgroundColor: color }} />
      <View style={{ height: 1.3, width: 10, borderRadius: 1, backgroundColor: color }} />
    </View>
  );
}
