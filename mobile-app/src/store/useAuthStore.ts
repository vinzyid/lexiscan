import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import * as authApi from '../api/auth';
import type { ReaderProfile } from '../api/auth';
import { setSessionToken } from '../api/session-token';
import { isReadingLevelId } from '../theme/reading-levels';
import { THEMES, TYPE_LEVELS } from '../theme/palettes';
import { useOCRStore } from './useStore';

/**
 * Sesi pengguna: token Sanctum dan profilnya.
 *
 * Terpisah dari useStore karena umurnya berbeda. Isi useStore adalah preferensi
 * tampilan yang tetap berlaku meski belum masuk — aplikasi ini harus bisa
 * dipakai tanpa mendaftar lebih dulu. Yang di sini justru hilang begitu keluar.
 *
 * Disimpan di expo-secure-store, bukan AsyncStorage: token itu kredensial, dan
 * AsyncStorage menyimpannya sebagai berkas biasa yang bisa dibaca di perangkat
 * yang sudah di-root.
 */
const SESSION_KEY = 'lexiscan-session';

type Session = { token: string; reader: ReaderProfile };

interface AuthState {
  /** false sampai sesi tersimpan selesai dibaca; layar pembuka menunggunya. */
  hydrated: boolean;
  token: string | null;
  reader: ReaderProfile | null;

  restore: () => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (input: authApi.RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  /** Simpan satu preferensi ke akun. Diam-diam gagal kalau belum masuk. */
  pushPreference: (
    patch: Parameters<typeof authApi.savePreferences>[0],
  ) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  hydrated: false,
  token: null,
  reader: null,

  restore: async () => {
    try {
      const raw = await SecureStore.getItemAsync(SESSION_KEY);
      const session: Session | null = raw ? JSON.parse(raw) : null;

      if (session?.token && session.reader) {
        setSessionToken(session.token);
        set({ token: session.token, reader: session.reader });
        applyProfile(session.reader);
      }
    } catch {
      /*
       * Sesi yang tidak terbaca — penyimpanan rusak, atau bentuknya berubah
       * antar versi — diperlakukan sebagai belum masuk. Menjatuhkan aplikasi
       * di sini berarti mengunci pengguna dari aplikasinya sendiri, padahal
       * seluruh fiturnya toh bisa dipakai tanpa akun.
       */
    } finally {
      set({ hydrated: true });
    }
  },

  signIn: async (username, password) => {
    await adopt(set, await authApi.login(username, password));
  },

  signUp: async (input) => {
    await adopt(set, await authApi.register(input));
  },

  signOut: async () => {
    /*
     * Server dikabari lebih dulu, tapi kegagalannya tidak menghalangi: kalau
     * jaringannya mati, pengguna yang menekan "Keluar" tetap harus keluar dari
     * HP-nya sendiri. Tokennya akan kedaluwarsa sendiri di sisi server.
     */
    if (get().token) {
      try {
        await authApi.logout();
      } catch {
        // Sengaja diabaikan; lihat alasan di atas.
      }
    }

    setSessionToken(null);
    set({ token: null, reader: null });

    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
    } catch {
      // Sama: sesi di memori sudah bersih, dan itu yang menentukan.
    }
  },

  pushPreference: async (patch) => {
    if (!get().token) return;

    try {
      const { reader } = await authApi.savePreferences(patch);
      set({ reader });
      await persist({ token: get().token as string, reader });
    } catch {
      /*
       * Preferensi sudah tersimpan di perangkat lewat useStore; yang gagal
       * hanya menyalinnya ke akun. Memunculkan galat untuk ini akan mengganggu
       * pengguna karena sesuatu yang sudah berhasil dari sudut pandangnya.
       */
    }
  },
}));

/** Simpan sesi, pasang tokennya, lalu terapkan profilnya ke tampilan. */
async function adopt(set: (partial: Partial<AuthState>) => void, result: authApi.AuthResult) {
  setSessionToken(result.token);
  set({ token: result.token, reader: result.reader });

  await persist(result);
  applyProfile(result.reader);
}

async function persist(session: Session): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Sesi tetap berlaku sepanjang aplikasi terbuka; yang hilang hanya
    // kemampuannya bertahan setelah ditutup.
  }
}

/**
 * Pasang tampilan sesuai akun yang baru masuk.
 *
 * URUTANNYA MENENTUKAN. Preset kemampuan membaca dipasang lebih dulu sebagai
 * dasar, baru preferensi yang pernah diubah sendiri ditumpuk di atasnya. Kalau
 * dibalik, pengguna yang sengaja mematikan suara akan menemukannya menyala lagi
 * setiap kali masuk — preset menimpa pilihannya.
 */
function applyProfile(reader: ReaderProfile): void {
  const store = useOCRStore.getState();

  if (isReadingLevelId(reader.reading_level)) {
    store.applyReadingLevelPreset(reader.reading_level);
  }

  const saved = reader.preferences;

  if (saved.language === 'id' || saved.language === 'en') store.setLanguage(saved.language);

  // Id yang tidak dikenal diabaikan, bukan dijadikan galat: server boleh saja
  // mengenal tema yang belum ada di versi aplikasi ini.
  if (THEMES.some((theme) => theme.id === saved.theme)) {
    store.setThemeId(saved.theme as never);
  }

  if (TYPE_LEVELS.some((level) => level.id === saved.type_level)) {
    store.setTypeLevelId(saved.type_level as never);
  }

  if (saved.tts_enabled !== null) store.setTtsEnabled(saved.tts_enabled);
  if (saved.tts_auto_play !== null) store.setTtsAutoPlay(saved.tts_auto_play);
  if (saved.syllable_spacing !== null) store.setSyllableSpacing(saved.syllable_spacing);

  /*
   * Dibaca ulang, bukan dari `store` di atas: preset baru saja mengubah
   * bicolorMode, dan snapshot `store` masih memuat nilai sebelum itu.
   * Membandingkannya dengan nilai basi akan membalik sakelarnya justru saat
   * keduanya sudah sama.
   */
  if (saved.bicolor_words !== null && saved.bicolor_words !== useOCRStore.getState().bicolorMode) {
    store.toggleBicolorMode();
  }
}
