import Constants from 'expo-constants';

import type { ExplainStyleId, SimplifyLevelId } from '../data/sample-document';

/**
 * Alamat backend Laravel.
 *
 * Urutan prioritas:
 * 1. EXPO_PUBLIC_API_URL — nilainya ditanam saat build, jadi ini satu-satunya
 *    cara yang jalan di APK standalone. Untuk build EAS, isinya diatur di
 *    `eas.json` (bukan `.env`, yang tidak ikut ter-clone karena di-gitignore).
 * 2. Host Metro bundler (Constants.expoConfig.hostUri) — otomatis benar di
 *    emulator MAUPUN HP fisik, karena perangkat yang bisa memuat JS bundle
 *    pasti bisa mencapai IP yang sama. Backend tinggal jalan di mesin yang
 *    sama dengan `php artisan serve --host=0.0.0.0`.
 *
 * `null` kalau keduanya tidak ada, yaitu APK standalone yang dibangun tanpa
 * EXPO_PUBLIC_API_URL. Sebelumnya kasus itu diam-diam memakai `10.0.2.2`,
 * alias emulator Android untuk mesin host — di HP fisik alamat itu tidak
 * menunjuk ke mana pun, sehingga salah konfigurasi build muncul sebagai
 * "tidak bisa terhubung ke server" tanpa petunjuk penyebab sebenarnya.
 */
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_BASE_URL: string | null =
  process.env.EXPO_PUBLIC_API_URL ?? (metroHost ? `http://${metroHost}:8000` : null);

/** Batas validasi di backend (routes simplify-text dan explain-word). */
const MAX_SIMPLIFY_CHARS = 8000;
const MAX_TERM_CHARS = 200;
const MAX_CONTEXT_CHARS = 2000;

/** Timeout 60 detik di sisi server + jeda jaringan. */
const REQUEST_TIMEOUT_MS = 70_000;

export class AiApiError extends Error {}

async function postJson(path: string, body: Record<string, unknown>): Promise<any> {
  if (!API_BASE_URL) {
    /*
     * Hanya bisa terjadi karena salah konfigurasi saat build, bukan karena
     * keadaan jaringan. Jadi pesannya menyebut penyebab dan tindakannya,
     * bukan menyarankan pengguna memeriksa koneksi.
     */
    throw new AiApiError(
      'Alamat backend belum ditanam di aplikasi ini. Set EXPO_PUBLIC_API_URL saat build (di eas.json untuk build EAS), lalu build ulang.',
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    // Penyebabnya dibedakan lewat signal, bukan lewat isi error: pesan fetch
    // di React Native tidak konsisten antar-platform.
    throw new AiApiError(
      controller.signal.aborted
        ? 'Server terlalu lama merespons. Coba lagi sebentar.'
        : 'Tidak bisa terhubung ke server. Pastikan backend berjalan dan HP satu jaringan dengan laptop.',
    );
  } finally {
    clearTimeout(timer);
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    // Backend mengirim 'message' yang sudah ramah pengguna (422 validasi, 503 penyedia AI).
    throw new AiApiError(json?.message ?? `Permintaan gagal (HTTP ${response.status}).`);
  }

  return json;
}

/** POST /api/simplify-text — level L2 sampai L5. L1 adalah teks asli, tanpa AI. */
export async function simplifyText(
  text: string,
  level: Exclude<SimplifyLevelId, 'L1'>,
): Promise<string[]> {
  const json = await postJson('/api/simplify-text', {
    text: text.slice(0, MAX_SIMPLIFY_CHARS),
    level,
  });

  if (!Array.isArray(json?.paragraphs) || json.paragraphs.length === 0) {
    throw new AiApiError('Server tidak mengembalikan hasil penyederhanaan.');
  }

  return json.paragraphs;
}

/** POST /api/explain-word — jelaskan kata atau potongan teks dengan gaya tertentu. */
export async function explainTerm(
  term: string,
  style: ExplainStyleId,
  context?: string,
): Promise<string[]> {
  const json = await postJson('/api/explain-word', {
    term: term.slice(0, MAX_TERM_CHARS),
    style,
    context: context ? context.slice(0, MAX_CONTEXT_CHARS) : undefined,
  });

  if (!Array.isArray(json?.paragraphs) || json.paragraphs.length === 0) {
    throw new AiApiError('Server tidak mengembalikan penjelasan.');
  }

  return json.paragraphs;
}

/** POST /api/correct-typo — perbaiki typo hasil OCR dari kamera. */
export async function correctTypo(text: string): Promise<string> {
  const json = await postJson('/api/correct-typo', {
    text: text.slice(0, MAX_SIMPLIFY_CHARS),
  });

  if (!Array.isArray(json?.paragraphs) || json.paragraphs.length === 0) {
    throw new AiApiError('Server tidak mengembalikan teks hasil koreksi.');
  }

  // Gabungkan array of paragraphs menjadi satu string utuh dipisah \n\n
  return json.paragraphs.join('\n\n');
}
