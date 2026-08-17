import '../global.css';
import { Stack, useRootNavigationState, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
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
import { useAuthStore } from '../src/store/useAuthStore';
import { useOCRStore } from '../src/store/useStore';

SplashScreen.preventAutoHideAsync();

/** Tahap pembuka sebelum aplikasi terlihat. */
type Intro = 'splash' | 'onboarding' | 'done';

/**
 * Menunggu preferensi tersimpan selesai dibaca dari AsyncStorage.
 *
 * `persist` milik Zustand memulihkan isinya secara asinkron, jadi sesaat setelah
 * aplikasi dijalankan `authPromptDismissed` masih bernilai bawaan `false` walau
 * penggunanya dulu sudah memilih "lihat-lihat dulu". Gerbang di bawah membaca
 * penanda itu, dan sekarang membacanya jauh lebih awal daripada sebelumnya,
 * sehingga penantian ini wajib: tanpa itu yang sudah menolak sekali akan
 * dilempar ke layar akun lagi setiap kali membuka aplikasi.
 */
function usePreferencesRestored() {
  /*
   * Dibaca lewat useSyncExternalStore, bukan useState + useEffect. Statusnya
   * milik store, bukan milik komponen ini, dan pembacaan seperti ini menutup
   * celah pemulihan yang selesai tepat di sela render pertama dan efeknya.
   */
  return useSyncExternalStore(
    (notify) => useOCRStore.persist.onFinishHydration(notify),
    () => useOCRStore.persist.hasHydrated(),
    () => useOCRStore.persist.hasHydrated(),
  );
}

function RootNavigator({ intro, onAdvance }: { intro: Intro; onAdvance: (next: Intro) => void }) {
  const colors = useThemeColors();
  const router = useRouter();

  // Navigasi sebelum navigator akarnya terpasang akan dilempar sebagai galat.
  const navigatorReady = Boolean(useRootNavigationState()?.key);

  const sessionRestored = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const preferencesRestored = usePreferencesRestored();
  const authPromptDismissed = useOCRStore((s) => s.authPromptDismissed);

  /*
   * Gerbang masuk sudah menentukan tujuannya, jadi pembukaan boleh dibuka.
   *
   * Ini penandanya, bukan penjaga efek di bawah: efeknya tetap ikut berubah
   * mengikuti `token`, supaya keluar dari akun tetap melempar penggunanya ke
   * layar akun seperti sebelumnya.
   */
  const [gateSettled, setGateSettled] = useState(false);

  /*
   * Gerbang masuk, dijalankan SELAGI layar pembuka masih menutupi navigator.
   *
   * Dulu syaratnya menunggu `intro === 'done'`, dan justru itu sumber kedipnya:
   * pembukaan dilepas lebih dulu, Beranda sempat tampil satu sampai dua detik,
   * barulah `router.replace` berjalan dan memasang layar akun di atasnya.
   * Sekarang urutannya dibalik. Perpindahannya terjadi di balik pembukaan, dan
   * pembukaan baru dilepas setelah tujuannya terpasang.
   *
   * Dua penantian sebelum memutuskan, dan keduanya perlu:
   * - `sessionRestored`, supaya pemilik akun yang sah tidak sempat dilempar ke
   *   layar daftar hanya karena sesinya belum selesai dibaca dari penyimpanan;
   * - `preferencesRestored`, dengan alasan yang dijelaskan di kait di atas.
   */
  useEffect(() => {
    if (!navigatorReady || !sessionRestored || !preferencesRestored) return;

    if (!token && !authPromptDismissed) {
      router.replace('/(auth)/welcome');
    }

    /*
     * Satu render tambahan memang yang diinginkan di sini, jadi peringatan
     * react-hooks/set-state-in-effect tidak berlaku: pembukaan hanya boleh
     * dilepas SETELAH perpindahan di atas dijalankan, dan urutan itulah yang
     * menghilangkan kedipnya. Menghitungnya saat render akan melepas pembukaan
     * satu commit terlalu cepat.
     */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGateSettled(true);
  }, [
    navigatorReady,
    sessionRestored,
    preferencesRestored,
    token,
    authPromptDismissed,
    router,
  ]);

  /*
   * Pembukaan bertahan sampai dua hal terpenuhi: slide terakhir sudah dilewati
   * DAN gerbangnya sudah memutuskan. Syarat kedua yang menutup kedipnya kalau
   * pemulihan penyimpanan ternyata lebih lambat daripada penggunanya menggeser.
   */
  const introVisible = intro !== 'done' || !gateSettled;

  // Ditumpuk di atas navigator, bukan jadi rute, supaya Beranda tidak sempat
  // berkedip lebih dulu.
  return (
    <>
      <StatusBar style={introVisible || colors.isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>

      {intro === 'splash' ? (
        <View style={StyleSheet.absoluteFill}>
          <BrandSplash onDone={() => onAdvance('onboarding')} />
        </View>
      ) : null}

      {intro !== 'splash' && introVisible ? (
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

  /*
   * Sesi tersimpan dibaca berbarengan dengan splash juga. Kalau menunggu sampai
   * layar pertama terlihat, pemilik akun akan sempat melihat tampilan bawaan
   * sebelum preferensi akunnya terpasang — dan bagi yang belum bisa membaca,
   * "sebentar" itu berarti satu layar penuh huruf kecil tanpa suara.
   */
  useEffect(() => {
    void useAuthStore.getState().restore();
  }, []);

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
