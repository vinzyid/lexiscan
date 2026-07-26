import { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Camera, BookOpen, Brain, Focus, Sparkles, Rainbow, Ruler, Type, ScanSearch } from 'lucide-react-native';

import { useOCRStore, XP_PER_LEVEL } from '../../src/store/useStore';
import { useThemeColors } from '../../src/theme/theme-provider';
import { getTypeLevel } from '../../src/theme/palettes';
import { DAILY_TIPS, getSimplifyLevel } from '../../src/data/sample-document';
import { TypographySheet } from '../../src/components/typography-sheet';
import { ExplainSheet } from '../../src/components/explain-sheet';

/** Tip harian dirotasi per tanggal supaya stabil sepanjang hari. */
const tipOfTheDay = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000);
  return DAILY_TIPS[dayOfYear % DAILY_TIPS.length];
};

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const { level, xp, streakDays, typeLevelId, simplifyLevel, focusMode, toggleFocusMode } = useOCRStore();
  const typeLevel = getTypeLevel(typeLevelId);
  const doc = getSimplifyLevel(simplifyLevel);

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
        {/* Banner sambutan + progres */}
        <View className="mb-6 overflow-hidden rounded-[28px] bg-primary p-6">
          <View className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
          <View className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full bg-white/5" />

          <View className="mb-5 flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="mb-1 font-opendyslexic text-xs text-white/80">Hei, Budi! 👋</Text>
              <Text className="font-opendyslexic text-xl font-bold leading-8 text-white">
                Siap petualangan{'\n'}hari ini? 🚀
              </Text>
            </View>
            <Text className="text-4xl">🦉</Text>
          </View>

          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              <View className="rounded-md bg-white/20 px-2 py-1">
                <Text className="font-opendyslexic text-[10px] font-bold text-white">Lv.{level}</Text>
              </View>
              <View className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                <View
                  className="h-full rounded-full bg-white"
                  style={{ width: `${Math.min(100, (xp / XP_PER_LEVEL) * 100)}%` }}
                />
              </View>
              <Text className="font-opendyslexic text-[10px] text-white/90">{xp} XP</Text>
            </View>
            <View className="ml-3 rounded-full bg-white/20 px-3 py-1.5">
              <Text className="font-opendyslexic text-[10px] font-bold text-white">🔥 {streakDays} hari</Text>
            </View>
          </View>
        </View>

        {/* Tip hari ini */}
        <View className="mb-6 flex-row items-start rounded-2xl border border-warm/30 bg-warm/10 p-4">
          <Text className="mr-3 mt-0.5 text-xl">✌️</Text>
          <View className="flex-1">
            <Text className="mb-1 font-opendyslexic text-[10px] font-bold uppercase tracking-widest text-primary">
              TIP HARI INI
            </Text>
            <Text className="font-opendyslexic text-xs leading-5 text-text-main">{tipOfTheDay()}</Text>
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
              <Text className="mb-1 font-opendyslexic text-sm font-bold text-white">Pindai Dokumen</Text>
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
              <Text className="mb-1 font-opendyslexic text-sm font-bold text-text-main">Lanjut Baca</Text>
              <Text className="font-opendyslexic text-[10px] text-text-muted">
                {doc.id} • {typeLevel.name}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* 5 fitur utama */}
        <Text className="mb-4 font-opendyslexic text-[10px] font-bold uppercase tracking-widest text-text-main">
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
              <Text className="flex-1 font-opendyslexic text-[10px] font-bold text-text-main" numberOfLines={1}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Inovasi khusus disleksia */}
        <View className="rounded-3xl border border-border bg-surface p-5">
          <Text className="mb-5 font-opendyslexic text-[10px] font-bold uppercase tracking-widest text-text-main">
            INOVASI KHUSUS DISLEKSIA
          </Text>
          {innovations.map((item) => (
            <View key={item.title} className="mb-5 flex-row items-center">
              <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-surface-alt">
                {item.icon}
              </View>
              <View className="flex-1">
                <Text className="mb-0.5 font-opendyslexic text-xs font-bold text-text-main">{item.title}</Text>
                <Text className="font-opendyslexic text-[9px] leading-4 text-text-muted">{item.desc}</Text>
              </View>
            </View>
          ))}
          <Pressable
            onPress={() => router.push('/reader')}
            accessibilityRole="button"
            className="mt-1 rounded-2xl bg-primary/10 py-3">
            <Text className="text-center font-opendyslexic text-xs font-bold text-primary">
              Coba Sekarang →
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <TypographySheet visible={typographyOpen} onClose={() => setTypographyOpen(false)} />
      <ExplainSheet visible={explainOpen} onClose={() => setExplainOpen(false)} />
    </>
  );
}
