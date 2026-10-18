import * as Updates from 'expo-updates';

/**
 * Apakah layar uji tim (Uji Energi, Uji OCR, Uji Lafal) boleh dibuka.
 *
 * Tertutup hanya di APK rilis (channel `production`), terbuka di APK
 * `preview` yang dipakai tim untuk lomba dan pengujian, dan di development
 * build (channel-nya null).
 *
 * Ditentukan dari channel, BUKAN dari variabel `EXPO_PUBLIC_*` di eas.json:
 * variabel itu hanya tertanam saat build, sedangkan bundle `eas update`
 * dibuat ulang tanpa blok `env` eas.json, jadi layar uji akan hilang begitu
 * APK preview menerima OTA. Channel tertanam di bagian native APK dan tidak
 * berubah oleh OTA.
 */
export const TEST_TOOLS_ENABLED = Updates.channel !== 'production';
