import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, BookOpen, Brain, Focus, Sparkles, Rainbow, Ruler, Type, ScanSearch, Lightbulb, Hand, ChevronRight } from 'lucide-react-native';

import { useOCRStore } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { DAILY_TIPS } from '../../src/data/sample-document';
import { TypographySheet } from '../../src/components/typography-sheet';
import { ExplainSheet } from '../../src/components/explain-sheet';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  // Tip animasi carousel
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const tipInterval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        setCurrentTipIndex((prev) => (prev + 1) % DAILY_TIPS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 6000); // Ganti tip setiap 6 detik
    return () => clearInterval(tipInterval);
  }, []);

  /*
   * Dari dashboard belum ada dokumen yang dibuka, jadi sheet menjelaskan
   * topik dokumen contoh memakai jawaban kurasi (tanpa memanggil API).
   */
  const explainDemoTarget = { term: 'Mitokondria', useStaticAnswers: true };

  const { focusMode, toggleFocusMode } = useOCRStore();

  const features = [
    { icon: <Camera size={18} color={colors.textMain} />, label: 'Smart OCR Scan', onPress: () => router.push('/scanner') },
    { icon: <Type size={18} color={colors.primary} />, label: 'Adaptive Typography', onPress: () => setTypographyOpen(true) },
    { icon: <Brain size={18} color={colors.warm} />, label: 'AI Simplification', onPress: () => router.push('/reader') },
    {
      icon: <Focus size={18} color={colors.primary} />,
      label: 'Focus Reading',
      onPress: () => {
        if (!focusMode) toggleFocusMode();
        router.push('/reader');
      },
    },
    { icon: <Sparkles size={18} color={colors.warm} />, label: 'AI Explain This', onPress: () => setExplainOpen(true), wide: true },
  ];

  const innovations = [
    { icon: <Rainbow size={20} color={colors.primary} />, title: 'Bicolor Words', desc: 'Warna bergantian per kata bantu mata melacak baris' },
    { icon: <Ruler size={20} color={colors.textMuted} />, title: 'Reading Ruler', desc: 'Penggaris baca gerak mengikuti posisimu' },
    { icon: <ScanSearch size={20} color={colors.textMuted} />, title: 'Word Isolation', desc: 'Ketuk kata apapun — lihat besar + suku kata' },
  ];

  return (
    <>
      <ScrollView
        className="flex-1 bg-background px-5"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}>

        {/* Banner sambutan (XP/Level dihapus, diganti pesan hangat) */}
        <View className="mb-6 overflow-hidden rounded-[28px] bg-primary p-7">
          <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/5" />

          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="mb-2 font-opendyslexic text-xs text-white/80">Selamat datang kembali! 👋</Text>
              <Text className="font-opendyslexic-bold text-2xl leading-9 text-white">
                Siap belajar{'\n'}sesuatu yang baru?
              </Text>
            </View>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <Hand size={32} color="#FFFFFF" />
            </View>
          </View>
        </View>

        {/* Tip hari ini - Dengan Animasi Carousel & Ikon SVG */}
        <View className="mb-6 flex-row items-start rounded-2xl border border-warm/30 bg-warm/10 p-4">
          <View className="mr-3 mt-1 rounded-full bg-warm/20 p-2">
            <Lightbulb size={18} color={colors.warm} />
          </View>
          <View className="flex-1">
            <Text className="mb-1.5 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-primary">
              TIP HARI INI
            </Text>
            <Animated.Text
              style={{ opacity: fadeAnim }}
              className="font-opendyslexic text-xs leading-5 text-text-main">
              {DAILY_TIPS[currentTipIndex]}
            </Animated.Text>
          </View>
        </View>

        {/* Dua aksi utama */}
        <View className="mb-8 flex-row justify-between">
          <Pressable
            onPress={() => router.push('/scanner')}
            accessibilityRole="button"
            className="aspect-square w-[48%] justify-between rounded-3xl bg-primary p-5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-black/10">
              <Camera size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text className="mb-1 font-opendyslexic-bold text-sm text-white">Pindai Dokumen</Text>
              <Text className="font-opendyslexic text-[10px] text-white/70">Foto → Teks</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/reader')}
            accessibilityRole="button"
            className="aspect-square w-[48%] justify-between rounded-3xl border border-border bg-surface p-5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <BookOpen size={20} color={colors.primary} />
            </View>
            <View>
              <Text className="mb-1 font-opendyslexic-bold text-sm text-text-main">Lanjut Baca</Text>
              <Text className="font-opendyslexic text-[10px] text-text-muted">
                Teks terakhir dipindai
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 5 fitur utama */}
        <Text className="mb-4 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-text-main">
          5 FITUR UTAMA
        </Text>
        <View className="mb-8 flex-row flex-wrap justify-between">
          {features.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.onPress}
              accessibilityRole="button"
              className={`mb-3 flex-row items-center rounded-2xl border border-border bg-surface p-3 ${
                item.wide ? 'w-full' : 'w-[48%]'
              }`}>
              <View className="mr-2 rounded-xl bg-surface-alt p-2">{item.icon}</View>
              <Text
                className="flex-1 font-opendyslexic-bold text-[10px] leading-[14px] text-text-main"
                numberOfLines={2}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Inovasi khusus disleksia */}
        <View className="rounded-3xl border border-border bg-surface p-5">
          <Text className="mb-5 font-opendyslexic-bold text-[10px] uppercase tracking-widest text-text-main">
            INOVASI KHUSUS DISLEKSIA
          </Text>
          {innovations.map((item) => (
            <View key={item.title} className="mb-5 flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-surface-alt">
                {item.icon}
              </View>
              <View className="flex-1">
                <Text className="mb-0.5 font-opendyslexic-bold text-xs text-text-main">{item.title}</Text>
                <Text className="font-opendyslexic text-[9px] leading-4 text-text-muted">{item.desc}</Text>
              </View>
            </View>
          ))}
          <Pressable
            onPress={() => router.push('/reader')}
            accessibilityRole="button"
            className="mt-1 flex-row items-center justify-center rounded-2xl bg-primary/10 py-3">
            <Text className="mr-2 font-opendyslexic-bold text-xs text-primary">
              Coba Sekarang
            </Text>
            <ChevronRight size={14} color={colors.primary} />
          </Pressable>
        </View>
      </ScrollView>

      <TypographySheet visible={typographyOpen} onClose={() => setTypographyOpen(false)} />
      <ExplainSheet target={explainOpen ? explainDemoTarget : null} onClose={() => setExplainOpen(false)} />
    </>
  );
}
