import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { postJson } from './ai';

/**
 * Dua jenis laporan yang diterima backend. `ocr_failure` dipisahkan dari
 * masukan biasa karena dipantau berbeda di dashboard: ia menandai halaman yang
 * gagal dibaca, bukan pendapat tentang aplikasinya.
 */
export type FeedbackType = 'feedback' | 'ocr_failure';

/** Menyamai batas validasi di backend. */
export const MAX_MESSAGE_CHARS = 2000;
const MAX_SAMPLE_CHARS = 2000;

/**
 * POST /api/feedback — masukan pengguna dan laporan kegagalan OCR.
 *
 * Tidak memakai kuota LLM, tapi berada di balik kunci API dan throttle yang
 * sama, jadi jalurnya tetap `postJson`. Galatnya berupa AiApiError berisi pesan
 * yang sudah siap ditampilkan, persis seperti endpoint AI.
 */
export async function sendFeedback(input: {
  type: FeedbackType;
  message: string;
  /** Potongan teks yang gagal dibaca; hanya dikirim kalau pengguna setuju. */
  sample?: string;
}): Promise<void> {
  await postJson('/api/feedback', {
    type: input.type,
    message: input.message.trim().slice(0, MAX_MESSAGE_CHARS),
    // undefined, bukan string kosong: kunci ber-undefined hilang dari JSON,
    // jadi laporan tanpa lampiran benar-benar tidak membawa field ini.
    sample: input.sample?.trim() ? input.sample.trim().slice(0, MAX_SAMPLE_CHARS) : undefined,
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? undefined,
  });
}
