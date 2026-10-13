import { normalizeSpeechText } from '../speech/speech-service';

/**
 * Pemetaan posisi karakter TTS ke indeks kata — bagian dari fitur "highlight
 * per-kata mengikuti suara".
 *
 * KENAPA UTIL TERSENDIRI. Mesin TTS melaporkan `charIndex` relatif terhadap
 * teks yang SUDAH dinormalisasi (`normalizeSpeechText`), sedangkan kata di
 * layar dirender dari teks mentah. Keduanya harus dihitung dengan aturan
 * pemecahan kata yang sama, dan di sinilah aturan itu ditulis sekali.
 *
 * BATASAN YANG DISADARI. Token "kata" di sini berarti "potongan yang dipisah
 * spasi". `normalizeSpeechText` sesekali mengubah jumlah token dari teks mentah
 * — misalnya "hari.Besok" dirapikannya jadi "hari. Besok" (menambah satu token),
 * atau "..." diringkas jadi "." (mengurangi). Pada halaman buku yang lazim
 * (spasi antar kata sudah benar) jumlahnya sama, sehingga indeksnya klop. Kalau
 * tidak sama, `alignWordIndex` di bawah menjepit indeksnya agar sorotan tetap
 * menunjuk kata yang masuk akal, bukan menghilang.
 */

/**
 * Indeks kata yang memuat karakter ke-`charIndex` dari `normalizedText`.
 *
 * Mengembalikan `null` kalau teksnya kosong atau posisinya di luar jangkauan.
 * Spasi dihitung sebagai pemisah; karakter apa pun yang bukan spasi adalah
 * bagian dari sebuah kata.
 */
export function wordIndexAtChar(normalizedText: string, charIndex: number): number | null {
  if (charIndex < 0 || normalizedText.length === 0) return null;

  /*
   * `charIndex` dari mesin TTS menunjuk AWAL sebuah kata. Kalau karena satu dan
   * lain hal posisinya jatuh tepat di spasi pemisah, yang benar adalah kata yang
   * BARU SAJA selesai (yaitu kata sebelum spasi itu) — bukan kata berikutnya,
   * karena kata berikutnya belum mulai diucapkan. Karena itu posisinya dimundurkan
   * dulu ke karakter non-spasi terakhir sebelum dihitung.
   */
  let limit = Math.min(charIndex, normalizedText.length - 1);
  while (limit > 0 && /\s/.test(normalizedText[limit])) limit -= 1;

  let wordIndex = 0;
  let inWord = false;

  for (let i = 0; i <= limit; i += 1) {
    const isSpace = /\s/.test(normalizedText[i]);

    if (!isSpace && !inWord) {
      inWord = true;
    } else if (isSpace && inWord) {
      inWord = false;
      wordIndex += 1;
    }
  }

  return wordIndex;
}

/** Jumlah kata dalam sebuah teks dengan aturan pemisahan yang sama. */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;

  return trimmed.split(/\s+/).length;
}

/**
 * Jumlah kata yang seharusnya dimiliki sebuah paragraf di layar, dihitung dari
 * teks yang benar-benar dibunyikan. Dipakai untuk menjepit indeks kata aktif.
 */
export function speechWordCount(paragraph: string): number {
  return countWords(normalizeSpeechText(paragraph));
}

/**
 * Jaga agar indeks kata tetap di dalam rentang kata yang tersedia.
 *
 * Kalau aliran normalisasi mengubah jumlah token, `wordIndexAtChar` bisa
 * menghasilkan angka di luar jumlah kata yang dirender. Menjepitnya lebih baik
 * daripada mengembalikan indeks yang tak menunjuk apa pun (sorotan hilang),
 * karena kata terakhir masih jauh lebih menolong daripada tidak ada sorotan.
 */
export function alignWordIndex(index: number | null, totalWords: number): number | null {
  if (index === null || totalWords <= 0) return null;
  if (index >= totalWords) return totalWords - 1;

  return Math.max(0, index);
}
