import { Stack } from 'expo-router';

/**
 * Satu layar saja. Masuk dan daftar dulu terpisah (`login` & `register`), tapi
 * keduanya sekarang jadi satu wizard di `welcome` — pilihannya ada di segmen
 * "Pengguna Baru / Sudah Punya Akun" pada langkah pertama.
 *
 * Namanya `welcome`, bukan `index`, dan itu perlu: `index` di dalam grup
 * memetakan ke `/` yang sudah dipakai `(tabs)/index`, sehingga dua layar
 * berebut rute yang sama.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
