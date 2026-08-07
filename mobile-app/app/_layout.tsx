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
import { useServerDefaults } from '../src/hooks/use-server-defaults';

SplashScreen.preventAutoHideAsync();

/** Tahap pembuka sebelum aplikasi terlihat. */
type Intro = 'splash' | 'onboarding' | 'done';

function RootNavigator({ intro, onAdvance }: { intro: Intro; onAdvance: (next: Intro) => void }) {
  const colors = useThemeColors();

  // Ditumpuk di atas navigator, bukan jadi rute, supaya Beranda tidak sempat
  // berkedip lebih dulu.
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
   * Fredoka untuk antarmuka, Atkinson Hyperlegible untuk teks bacaan (huruf
   * mirip seperti b/d dan I/l dibedakan bentuknya, lebih aman bagi pembaca
   * disleksia).
   *
   * Tiap berat didaftarkan sebagai family tersendiri karena di Android
   * fontFamily kustom + fontWeight membuat RN mundur ke font sistem.
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
   * Dijalankan berbarengan dengan splash: hasilnya sudah diterapkan sebelum
   * layar pertama terlihat, jadi tidak ada tema yang berganti di depan mata
   * pengguna.
   */
  useServerDefaults();

  // Splash sistem ditahan sampai font siap; BrandSplash memakai Fredoka.
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

  // Wajib: tanpa ini gestur di layar Baca diam saja di Android.
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
