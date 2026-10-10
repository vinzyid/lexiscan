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
 * menunjuk https:// otomatis mengunci cleartext.
 *
 * Dibaca DI DALAM fungsi, bukan di tingkat modul: Expo memuat berkas .env
 * sebelum memanggil fungsi ini, sedangkan evaluasi tingkat modul bisa berjalan
 * lebih dulu dan melihat process.env yang masih kosong. Itu sebabnya salah
 * profil pernah tercetak "(host Metro) padahal .env sudah diisi.
 *
 * `EXPO_PUBLIC_API_URL` yang kosong di profil non-development sengaja TIDAK
 * membuka cleartext: build yang lupa mengisi alamat backend harus tetap
 * terkunci, bukan diam-diam mengizinkan HTTP polos.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const profile = process.env.EAS_BUILD_PROFILE ?? process.env.EXPO_PUBLIC_BUILD_PROFILE;
  const isDevBuild = profile === 'development';

  // Selama pengembangan, host Metro selalu http, jadi cleartext wajib menyala.
  // Di luar itu, hanya alamat http:// eksplisit yang membukanya.
  const usesCleartextTraffic = isDevBuild || (apiUrl?.startsWith('http://') ?? false);

  // Dicetak supaya salah profil ketahuan dari log build. Kuncinya tidak dicetak.
  console.log(
    `[lexiscan] backend=${apiUrl ?? '(host Metro)'} profil=${profile ?? '-'} cleartext=${usesCleartextTraffic ? 'DIIZINKAN' : 'diblokir'}`,
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
