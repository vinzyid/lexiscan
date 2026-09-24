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
     *
     * Pemulihan bisa selesai tepat di sela pemeriksaan dan pemasangan
     * pendengar, sehingga panggilan baliknya tidak pernah datang. Karena itu
     * keadaannya diperiksa ULANG sesudah mendaftar; `apply` sendiri idempoten,
     * jadi terpanggil dua kali pun tidak apa-apa.
     */
    const start = () => {
      if (cancelled) return;

      void apply();
    };

    const unsubscribe = useOCRStore.persist.onFinishHydration(start);

    if (useOCRStore.persist.hasHydrated()) {
      start();
    }

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
}
