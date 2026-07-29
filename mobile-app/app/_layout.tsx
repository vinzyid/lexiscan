import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

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

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const colors = useThemeColors();

  return (
    <>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
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

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
