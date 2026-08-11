import * as Speech from 'expo-speech';

import type { LanguageId } from '../store/useStore';

/**
 * Memilih SUARA, bukan sekadar bahasa.
 *
 * KENAPA BERKAS INI ADA. Sebelumnya `speak()` hanya menyebut bahasa ('id-ID')
 * dan menyerahkan pilihan suaranya ke mesin TTS. Ada dua akibat, dan keduanya
 * terdengar:
 *
 * 1. Mesin memakai suara BAWAAN untuk bahasa itu, yang di kebanyakan HP Android
 *    adalah suara lokal berukuran kecil — persis yang terdengar "aneh". Padahal
 *    Google TTS umumnya memasang beberapa suara Indonesia sekaligus dan yang
 *    berkualitas tinggi tinggal disebut namanya.
 *
 * 2. Ada cacat di sisi expo-speech Android: `SpeechModule.kt` membuat locale
 *    dengan `Locale("id-ID")`, sedangkan konstruktor Java itu memperlakukan
 *    seluruh string sebagai KODE BAHASA ("id-id") yang tidak valid. Akibatnya
 *    `isLanguageAvailable` gagal dan mesin mundur ke `Locale.getDefault()` —
 *    bahasa sistem HP. Di HP berbahasa Inggris, teks Indonesia dilafalkan
 *    dengan fonetik Inggris.
 *
 * Menyebut `voice` secara eksplisit menambal keduanya sekaligus: di Android
 * `setVoice` dipanggil SESUDAH bahasa dipasang, jadi ia menang.
 */

/**
 * Kode bahasa yang dianggap sama saat mencocokkan `Voice.language`.
 *
 * KENAPA 'in' IKUT, DAN INI BUKAN SALAH KETIK. Java menyimpan kode ISO 639
 * LAMA untuk tiga bahasa demi kesesuaian ke belakang — Ibrani `iw`, Yiddish
 * `ji`, dan Indonesia `in` — sehingga `Locale("id").getLanguage()` menjawab
 * "in". `LanguageUtils.getISOCode()` di expo-speech menurunkan kodenya lewat
 * jalan itu, jadi suara Indonesia dilaporkan ke JavaScript sebagai "in-ID".
 *
 * Mencari awalan "id" saja membuat daftarnya SELALU kosong di Android: tidak
 * ada suara yang disebut, mesin memakai bahasa sistem HP, dan teks Indonesia
 * dibacakan dengan fonetik Inggris. Keduanya harus diterima.
 */
const CODES: Record<LanguageId, string[]> = {
  id: ['id', 'in'],
  en: ['en'],
};

/**
 * Cocokkan subtag bahasanya saja, bukan awalan mentah.
 *
 * "in-ID" dan "id" sama-sama Indonesia, tapi awalan mentah juga akan
 * meloloskan kode lain yang kebetulan berawalan sama.
 */
function matches(voiceLanguage: string | undefined, language: LanguageId): boolean {
  if (!voiceLanguage) return false;

  const subtag = voiceLanguage.toLowerCase().split(/[-_]/)[0];

  return CODES[language].includes(subtag);
}

export type VoiceOption = {
  /** Nilai yang dikirim ke `Speech.speak({ voice })`. */
  identifier: string;
  /** `VoiceQuality.Enhanced` — di Android berarti QUALITY_HIGH ke atas. */
  enhanced: boolean;
  /**
   * Suara yang dirender di server Google, bukan di HP. Terdengar paling bagus
   * tapi butuh internet, jadi tidak pernah dipilih otomatis.
   */
  network: boolean;
};

/**
 * Daftar suara mesin TTS, dimuat sekali.
 *
 * Disimpan sebagai Promise, bukan hasilnya, supaya dua pemanggil yang datang
 * bersamaan (mis. tombol bacakan dan layar Pengaturan) berbagi satu permintaan.
 * Dikosongkan lagi kalau gagal: di Android daftar ini baru terisi setelah mesin
 * TTS selesai menyala, dan panggilan pertama sesudah aplikasi dibuka bisa
 * datang lebih dulu daripada itu.
 */
let pending: Promise<Speech.Voice[]> | null = null;

export function loadVoices(): Promise<Speech.Voice[]> {
  pending ??= Speech.getAvailableVoicesAsync().catch(() => {
    pending = null;

    return [];
  });

  return pending;
}

/**
 * Suara yang tersedia untuk satu bahasa, terurut dari yang paling layak pakai.
 *
 * Urutannya: kualitas tinggi lebih dulu, lalu yang bekerja tanpa internet.
 * Suara `network` sengaja ditaruh di belakang meski biasanya paling merdu —
 * aplikasi ini dipakai di kelas, dan suara yang diam karena sinyal hilang lebih
 * buruk daripada suara yang kurang halus.
 */
export async function voicesFor(language: LanguageId): Promise<VoiceOption[]> {
  return (await loadVoices())
    .filter((voice) => matches(voice.language, language))
    .map((voice) => ({
      identifier: voice.identifier,
      enhanced: voice.quality === Speech.VoiceQuality.Enhanced,
      network: /network/i.test(voice.identifier),
    }))
    .sort((a, b) => {
      if (a.enhanced !== b.enhanced) return a.enhanced ? -1 : 1;
      if (a.network !== b.network) return a.network ? 1 : -1;

      // Tiebreak tetap, supaya urutan di layar Pengaturan tidak berubah-ubah
      // antar pembukaan aplikasi.
      return a.identifier.localeCompare(b.identifier);
    });
}

/**
 * Suara yang dipakai kalau pengguna belum memilih sendiri.
 *
 * Hasilnya diingat per bahasa: pemanggilnya adalah `speak()`, yang berjalan
 * tiap satu paragraf dibacakan, dan menyisir ulang daftar suara di situ berarti
 * menunda bunyinya tanpa alasan.
 */
const auto = new Map<LanguageId, string | undefined>();

export async function autoVoiceFor(language: LanguageId): Promise<string | undefined> {
  const remembered = auto.get(language);

  if (remembered !== undefined) return remembered;

  const best = (await voicesFor(language))[0]?.identifier;

  /*
   * Hasil kosong sengaja TIDAK diingat. Panggilan pertama bisa datang sebelum
   * mesin TTS Android selesai menyala dan mengembalikan daftar kosong; kalau
   * kekosongan itu ikut disimpan, suara tidak akan pernah terpakai lagi sampai
   * aplikasi ditutup. Menyisir ulang daftar yang sudah ada di memori murah.
   */
  if (best !== undefined) auto.set(language, best);

  return best;
}

/**
 * Terjemahkan pilihan pengguna menjadi identifier yang siap dikirim.
 *
 * `preferred` yang sudah tidak ada di HP — mis. mesin TTS-nya diganti atau
 * datanya dihapus — diperlakukan seolah belum memilih, bukan dibiarkan gagal
 * diam-diam ke suara bawaan sistem.
 */
export async function resolveVoice(
  language: LanguageId,
  preferred: string | null | undefined,
): Promise<string | undefined> {
  if (preferred) {
    const available = await voicesFor(language);

    if (available.some((voice) => voice.identifier === preferred)) return preferred;
  }

  return autoVoiceFor(language);
}
