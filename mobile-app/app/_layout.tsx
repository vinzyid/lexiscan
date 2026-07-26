import '../global.css';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

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
   * Bold didaftarkan sebagai family terpisah, bukan sebagai varian berat dari
   * "OpenDyslexic". Di Android, fontFamily kustom + fontWeight bold tanpa faces
   * terdaftar bikin RN mundur ke font sistem, jadi setiap teks tebal harus
   * menyebut family ini secara eksplisit lewat class `font-opendyslexic-bold`.
   */
  const [loaded, error] = useFonts({
    OpenDyslexic: require('../assets/fonts/OpenDyslexic-Regular.otf'),
    'OpenDyslexic-Bold': require('../assets/fonts/OpenDyslexic-Bold.otf'),
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
