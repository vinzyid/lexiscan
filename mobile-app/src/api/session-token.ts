/**
 * Token Sanctum yang sedang berlaku, disimpan di memori.
 *
 * Berkas sekecil ini ada karena alasan yang tidak kelihatan dari isinya:
 * memutus lingkaran impor. `src/api/ai.ts` perlu menempelkan token ke setiap
 * permintaan, sementara store autentikasi yang memegang token itu justru
 * memakai `postJson` dari `src/api/ai.ts` untuk masuk dan mendaftar. Kalau
 * keduanya saling mengimpor, Metro menyelesaikan salah satunya sebagai
 * undefined dan gejalanya muncul jauh dari sebabnya.
 *
 * Sumber kebenarannya tetap `src/store/useAuthStore.ts` — di sinilah salinan
 * yang boleh dibaca lapisan jaringan, dan hanya store itu yang menulisnya.
 */
let token: string | null = null;

export const setSessionToken = (value: string | null): void => {
  token = value;
};

export const currentSessionToken = (): string | null => token;

/** Header Authorization, atau objek kosong kalau belum masuk. */
export const authHeader = (): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};
