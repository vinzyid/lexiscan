import { useEffect } from 'react';

import { fetchServerDefaults } from '../api/ai';
import { useOCRStore } from '../store/useStore';

/**
 * Menerapkan bawaan tampilan yang ditetapkan admin dari dashboard, sekali tiap
 * aplikasi dijalankan.
 *
 * Gunanya: pilihan awal untuk pengguna baru bisa diperbaiki tanpa merilis ulang
 * APK. Yang sudah pernah mengatur sendiri tidak tersentuh — penjagaannya ada di
 * `applyServerDefaults`, bukan di sini.
 */
export function useServerDefaults() {
  useEffect(() => {
    let cancelled = false;

    const apply = async () => {
      const defaults = await fetchServerDefaults();

      if (defaults && !cancelled) {
        useOCRStore.getState().applyServerDefaults(defaults);
      }
    };

    /*
     * Wajib menunggu preferensi tersimpan selesai dibaca dari AsyncStorage.
     * Kalau bawaan server diterapkan lebih dulu, proses baca yang selesai
     * belakangan akan menimpanya kembali — dan pilihan admin tidak pernah
     * benar-benar terlihat.
     */
    if (useOCRStore.persist.hasHydrated()) {
      void apply();

      return () => {
        cancelled = true;
      };
    }

    const unsubscribe = useOCRStore.persist.onFinishHydration(() => void apply());

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}
