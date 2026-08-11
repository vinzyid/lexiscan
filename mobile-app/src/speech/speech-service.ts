import { Platform } from 'react-native';
import * as Speech from 'expo-speech';

import type { LanguageId } from '../store/useStore';
import { resolveVoice } from './voices';

/**
 * Satu-satunya tempat expo-speech dipanggil.
 *
 * KENAPA MESIN BAWAAN PERANGKAT, BUKAN AI. Suara di sini dipakai untuk setiap
 * paragraf yang dibuka, bukan sesekali — kalau tiap paragraf berarti satu
 * panggilan ke model, kuota AI habis untuk membacakan teks yang sudah ada di
 * layar, sementara fitur yang benar-benar butuh model (menyederhanakan,
 * menjelaskan) kehabisan jatah. expo-speech memakai mesin text-to-speech yang
 * sudah terpasang di perangkat: tanpa jaringan, tanpa biaya, tanpa batas
 * karakter, dan berbunyi seketika.
 *
 * Kalau suatu saat suaranya perlu ditingkatkan ke penyedia cloud, berkas inilah
 * satu-satunya yang perlu diubah — pemanggilnya hanya tahu `speak()` dan
 * `stop()`.
 */

/**
 * Bahasa antarmuka → kode bahasa untuk mesin TTS.
 *
 * BEDA ANTAR PLATFORM, DAN ITU TERPAKSA. iOS memakai
 * `AVSpeechSynthesisVoice(language:)` yang memang mengharapkan BCP 47 lengkap.
 * Android tidak: `SpeechModule.kt` menyusun `Locale(kode)`, dan konstruktor
 * Java satu argumen itu memperlakukan seluruh string sebagai kode bahasa —
 * "id-ID" menjadi bahasa bernama "id-id" yang tidak ada, `isLanguageAvailable`
 * menolaknya, lalu mesin diam-diam mundur ke bahasa sistem HP. Mengirim "id"
 * saja membuat locale-nya sah dan bahasanya benar-benar terpasang.
 */
const LANGUAGE_CODE: Record<LanguageId, string> = Platform.select({
  android: { id: 'id', en: 'en' },
  default: { id: 'id-ID', en: 'en-US' },
});

export type SpeakOptions = {
  language: LanguageId;
  /** Dari preset kemampuan membaca; lihat `src/theme/reading-levels.ts`. */
  rate: number;
  /**
   * Suara pilihan pengguna dari Pengaturan. Kosong berarti biarkan
   * `resolveVoice` memilihkan yang terbaik di HP ini.
   */
  voice?: string | null;
  onStart?: () => void;
  /** Dipanggil saat selesai, dihentikan, MAUPUN gagal — tepatnya sekali. */
  onSettled?: () => void;
};

/**
 * Bacakan teks. Selalu menghentikan ucapan sebelumnya lebih dulu.
 *
 * Tanpa penghentian itu, Android mengantrekan ucapan baru di belakang yang
 * lama: menekan tombol tiga paragraf berturut-turut berarti menunggu dua
 * paragraf pertama selesai. Yang diharapkan pengguna adalah yang terakhir
 * ditekan itulah yang berbunyi.
 */
export async function speak(text: string, options: SpeakOptions): Promise<void> {
  const clean = normalize(text);

  if (clean.length === 0) {
    options.onSettled?.();

    return;
  }

  await stop();

  /*
   * Suaranya dicari SESUDAH stop(), bukan sebelum: pencarian pertama harus
   * menunggu mesin TTS menyala, dan menunda penghentian ucapan lama selama itu
   * membuat tombol terasa tidak menanggapi.
   */
  const voice = await resolveVoice(options.language, options.voice);

  /*
   * Penjaga supaya onSettled tidak terpanggil dua kali. expo-speech bisa
   * memanggil onDone dan onStopped untuk satu ucapan yang sama, dan pemanggil
   * memakai callback ini untuk mematikan indikator "sedang berbunyi".
   */
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    options.onSettled?.();
  };

  Speech.speak(clean, {
    language: LANGUAGE_CODE[options.language],
    voice,
    rate: options.rate,
    onStart: options.onStart,
    onDone: settle,
    onStopped: settle,
    onError: settle,
  });
}

export async function stop(): Promise<void> {
  try {
    await Speech.stop();
  } catch {
    /*
     * Menghentikan sesuatu yang memang tidak berbunyi bukan kegagalan yang
     * perlu diteruskan. Ini dipanggil dari pembersihan useEffect, dan galat di
     * sana akan muncul sebagai layar merah untuk masalah yang tidak ada.
     */
  }
}

export async function isSpeaking(): Promise<boolean> {
  try {
    return await Speech.isSpeakingAsync();
  } catch {
    return false;
  }
}

/**
 * Rapikan teks sebelum dibunyikan.
 *
 * Emoji dan simbol hiasan dibuang: mesin TTS Android membacakan namanya
 * ("tanda seru berulang", "wajah tersenyum") di tengah kalimat, dan itu justru
 * memecah perhatian pembaca yang sedang mencocokkan bunyi dengan tulisan.
 * Prompt di backend sudah melarang model memakainya, tapi teks hasil OCR bisa
 * memuat apa saja.
 */
function normalize(text: string): string {
  return (
    text
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu, ' ')

      /*
       * Sisa penanda markdown. Model diminta tidak memakainya, tapi sesekali
       * lolos — dan bintang di tengah kalimat dibacakan sebagai "bintang",
       * bukan diabaikan.
       */
      .replace(/[*_#`~]/g, ' ')

      /*
       * Titik yang menempel ke kata berikutnya, khas hasil OCR ("hari.Besok").
       * Tanpa spasi itu mesin TTS membaca keduanya sebagai satu kata panjang
       * dan tidak memberi jeda antar kalimat — jeda yang justru paling
       * dibutuhkan pembaca yang sedang mencocokkan bunyi dengan tulisan.
       */
      .replace(/([.!?,;:])(\p{Lu})/gu, '$1 $2')

      // Titik-titik beruntun dilafalkan satu per satu; satu saja sudah cukup
      // untuk memberi jeda.
      .replace(/\.{2,}/g, '.')
      .replace(/\s+/g, ' ')
      .trim()
  );
}
