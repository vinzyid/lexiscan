import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  Fredoka_300Light,
  Fredoka_400Regular,
  Fredoka_500Medium,
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  AtkinsonHyperlegible_400Regular,
  AtkinsonHyperlegible_700Bold,
} from '@expo-google-fonts/atkinson-hyperlegible';

import { ThemeProvider, useThemeColors } from '../src/theme/theme-provider';
import { BrandSplash } from '../src/components/brand-splash';
import { Onboarding } from '../src/components/onboarding';

SplashScreen.preventAutoHideAsync();

/** Tahap pembuka sebelum aplikasi terlihat. */
type Intro = 'splash' | 'onboarding' | 'done';

function RootNavigator({ intro, onAdvance }: { intro: Intro; onAdvance: (next: Intro) => void }) {
  const colors = useThemeColors();

  /*
   * Ditumpuk di atas navigator, bukan jadi rute: sebagai rute keduanya masuk
   * riwayat navigasi dan Beranda sempat berkedip lebih dulu.
   */
  return (
    <>
      <StatusBar style={intro !== 'done' || colors.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>

      {intro === 'splash' ? (
        <View style={StyleSheet.absoluteFill}>
          <BrandSplash onDone={() => onAdvance('onboarding')} />
        </View>
      ) : null}

      {intro === 'onboarding' ? (
        <View style={StyleSheet.absoluteFill}>
          <Onboarding onDone={() => onAdvance('done')} />
        </View>
      ) : null}
    </>
  );
}

export default function RootLayout() {
  /*
   * Dua keluarga font sesuai Figma: Fredoka untuk seluruh antarmuka, Atkinson
   * Hyperlegible khusus teks bacaan (huruf-huruf yang mirip dibedakan bentuknya
   * — b/d, p/q, I/l — jadi lebih aman untuk pembaca disleksia).
   *
   * Tiap berat didaftarkan sebagai family tersendiri. Di Android, fontFamily
   * kustom + fontWeight tanpa face terdaftar bikin RN mundur ke font sistem,
   * jadi berat selalu disebut lewat class (`font-ui-bold`, `font-read-bold`).
   */
  const [loaded, error] = useFonts({
    Fredoka_300Light,
    Fredoka_400Regular,
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
  });

  /*
   * Splash sistem ditahan sampai font dimuat, karena BrandSplash memakai
   * Fredoka — tanpa itu judulnya sempat tampil dengan font sistem.
   */
  const [intro, setIntro] = useState<Intro>('splash');
  const advanceIntro = useCallback((next: Intro) => setIntro(next), []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  // Tanpa GestureHandlerRootView, gestur di layar Baca diam saja di Android
  // tanpa pesan error apa pun.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator intro={intro} onAdvance={advanceIntro} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
