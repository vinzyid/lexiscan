import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Config dinamis; nilai statisnya tetap di app.json dan diterima lewat `config`.
 *
 * Tugasnya satu: menentukan izin HTTP polos (cleartext) dari alamat backend.
 * Android 9+ memblokirnya kecuali diizinkan, dan izin itu hanya boleh menyala
 * saat pengembangan — di APK yang dibagikan, teks hasil scan pengguna akan
 * lewat tanpa enkripsi.
 *
 * Diturunkan dari alamat backend, bukan flag terpisah, supaya build yang
 * menunjuk https:// otomatis mengunci cleartext. `undefined` berarti build
 * pengembangan yang mengikuti host Metro (selalu http); string kosong berarti
 * profil build yang alamatnya belum diisi, jadi perbandingannya eksplisit.
 */
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
const usesCleartextTraffic = apiUrl === undefined || apiUrl.startsWith('http://');

export default ({ config }: ConfigContext): ExpoConfig => {
  // Dicetak supaya salah profil ketahuan dari log build. Kuncinya tidak dicetak.
  console.log(
    `[lexiscan] backend=${apiUrl ?? '(host Metro)'} cleartext=${usesCleartextTraffic ? 'DIIZINKAN' : 'diblokir'}`,
  );

  return {
    ...config,
    name: config.name ?? 'LexiScan',
    slug: config.slug ?? 'mobile-app',
    plugins: [
      ...(config.plugins ?? []),
      ['expo-build-properties', { android: { usesCleartextTraffic } }],
    ],
  };
};
