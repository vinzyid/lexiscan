import Constants from 'expo-constants';

import type { ExplainStyleId, SimplifyLevelId } from '../data/sample-document';
import { dictionaryFor } from '../i18n';
import { useOCRStore, type FootprintSample, type ServerDefaults } from '../store/useStore';
import { currentDeviceId } from '../utils/device-id';
import { authHeader } from './session-token';

/**
 * Alamat backend Laravel:
 * 1. EXPO_PUBLIC_API_URL, ditanam saat build (eas.json untuk EAS, .env untuk
 *    build lokal). Satu-satunya cara yang jalan di APK standalone.
 * 2. Host Metro bundler, otomatis benar di emulator maupun HP fisik selama
 *    backend jalan dengan `php artisan serve --host=0.0.0.0`.
 *
 * `null` kalau keduanya kosong, supaya salah konfigurasi build muncul sebagai
 * pesan yang menyebut sebabnya, bukan sebagai gagal koneksi biasa.
 */
const metroHost = Constants.expoConfig?.hostUri?.split(':')[0];

export const API_BASE_URL: string | null =
  process.env.EXPO_PUBLIC_API_URL ?? (metroHost ? `http://${metroHost}:8000` : null);

/**
 * Harus sama dengan AI_API_KEY di backend. Boleh kosong saat pengembangan
 * karena backend mematikan penjagaan ini ketika APP_ENV=local.
 */
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

/** Menyamai batas validasi di backend. */
const MAX_SIMPLIFY_CHARS = 8000;
const MAX_TERM_CHARS = 200;
const MAX_CONTEXT_CHARS = 2000;

/** Timeout 60 detik di sisi server + jeda jaringan. */
const REQUEST_TIMEOUT_MS = 70_000;

/**
 * Jauh lebih pendek dari permintaan AI: pemanggilnya berjalan saat aplikasi
 * dibuka, dan menunggu lama demi preferensi awal tidak sepadan.
 */
const HEALTH_TIMEOUT_MS = 6_000;

export class AiApiError extends Error {}

/** Dibaca dari store, bukan hook: berkas ini dipanggil dari luar komponen React. */
const strings = () => dictionaryFor(useOCRStore.getState().language);

const requestLanguage = () => useOCRStore.getState().language;

/**
 * Kemampuan membaca pengirimnya, ikut di setiap permintaan AI.
 *
 * Backend memakainya untuk membatasi panjang jawaban: yang belum bisa membaca
 * mendapat satu paragraf maksimal dua kalimat, sementara yang sudah lancar
 * boleh menerima dua paragraf. Tanpa ini, semua orang menerima jawaban dengan
 * panjang yang sama — persis keluhan yang disampaikan dosen PLB.
 */
const requestReadingLevel = () => useOCRStore.getState().readingLevel;

/**
 * Satu-satunya jalur POST ke backend; dipakai juga oleh `src/api/feedback.ts`,
 * yang bukan endpoint AI tapi memerlukan penanganan kunci, penanda perangkat,
 * timeout, dan pesan galat yang persis sama.
 */
export async function postJson(
  path: string,
  body: Record<string, unknown>,
  options: { method?: 'POST' | 'PATCH' } = {},
): Promise<any> {
  const t = strings();

  if (!API_BASE_URL) {
    // Salah konfigurasi saat build, bukan masalah jaringan — pesannya berbeda.
    throw new AiApiError(t.api.noBaseUrl);
  }

  /*
   * Penanda perangkat anonim, dipakai backend untuk memantau konsumsi kuota
   * dan menghentikan pemakaian yang tidak wajar. Null kalau penyimpanan lokal
   * tidak terbaca — backend menerima permintaan tanpa penanda ini.
   */
  const deviceId = await currentDeviceId();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        // Dikirim hanya kalau ada; 'X-Api-Key: undefined' ditolak backend
        // dengan alasan yang menyesatkan.
        ...(API_KEY ? { 'X-Api-Key': API_KEY } : {}),
        ...(deviceId ? { 'X-Device-Id': deviceId } : {}),
        ...authHeader(),
      },
      /*
       * `language` menentukan bahasa prompt sekaligus bahasa jawaban AI;
       * `reading_level` menentukan seberapa pendek jawabannya.
       *
       * Keduanya ditaruh SEBELUM `body`, jadi pemanggil yang menyebutkannya
       * sendiri tetap menang. Itu bukan detail: saat mendaftar, tingkat yang
       * baru saja dipilih di formulir belum masuk store, dan menimpanya dengan
       * nilai store berarti menyimpan jawaban yang salah ke akunnya.
       */
      body: JSON.stringify({
        language: requestLanguage(),
        reading_level: requestReadingLevel(),
        ...body,
      }),
      signal: controller.signal,
    });
  } catch {
    // Dibedakan lewat signal, karena pesan error fetch di React Native tidak
    // konsisten antar-platform.
    throw new AiApiError(controller.signal.aborted ? t.api.timeout : t.api.unreachable);
  } finally {
    clearTimeout(timer);
  }

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    // Backend sudah mengirim 'message' yang siap ditampilkan ke pengguna.
    throw new AiApiError(json?.message ?? t.api.httpError(response.status));
  }

  /*
   * Jejak karbon dicatat di sini, bukan di masing-masing pemanggil: fungsi ini
   * satu-satunya jalur yang dilewati semua endpoint AI, jadi tidak ada
   * permintaan yang bisa lolos dari hitungan. Backend versi lama tidak
   * mengirim blok ini, dan itu tidak apa-apa.
   */
  if (json?.footprint) {
    useOCRStore.getState().recordFootprint(json.footprint as FootprintSample);
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
    throw new AiApiError(strings().api.noSimplifyResult);
  }

  return json.paragraphs;
}

/** POST /api/explain-word — jelaskan kata dengan gaya tertentu. */
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
    throw new AiApiError(strings().api.noExplainResult);
  }

  return json.paragraphs;
}

/** POST /api/correct-typo — perbaiki typo hasil OCR dari kamera. */
export async function correctTypo(text: string): Promise<string> {
  const json = await postJson('/api/correct-typo', {
    text: text.slice(0, MAX_SIMPLIFY_CHARS),
  });

  if (!Array.isArray(json?.paragraphs) || json.paragraphs.length === 0) {
    throw new AiApiError(strings().api.noCorrectionResult);
  }

  return json.paragraphs.join('\n\n');
}

/**
 * GET /api/ai/health — diambil hanya untuk field `defaults`, yaitu tema dan
 * tingkat tipografi awal yang ditetapkan admin dari dashboard.
 *
 * Sengaja tidak pernah melempar galat dan tidak memakai `postJson`: ini
 * permintaan latar yang tidak diminta pengguna, jadi kegagalannya — server
 * mati, tidak ada jaringan, backend versi lama tanpa field ini — harus
 * berlalu tanpa suara dan menyisakan bawaan yang tertulis di aplikasi.
 * Endpointnya terbuka tanpa kunci API, jadi tidak ada header yang perlu ikut.
 */
export async function fetchServerDefaults(): Promise<ServerDefaults | null> {
  if (!API_BASE_URL) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/health`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    const defaults = json?.defaults;

    return defaults && typeof defaults === 'object' ? (defaults as ServerDefaults) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
