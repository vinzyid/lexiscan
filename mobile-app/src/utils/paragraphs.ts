/**
 * Pembagian teks bacaan menjadi paragraf, dipakai layar Baca dan ringkasan di
 * layar Pindai supaya jumlah paragraf yang dijanjikan di sana sama dengan yang
 * benar-benar muncul.
 */

/** Pecah teks mentah per baris; satu baris tak kosong adalah satu paragraf. */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Akhir kalimat: tanda titik, seru, atau tanya, boleh diikuti tanda kutip/kurung. */
const SENTENCE_END = /[.!?]["')\]]*$/;

const wordCount = (text: string) => text.split(/\s+/).filter((word) => word.length > 0).length;

/**
 * Kelompokkan ulang paragraf supaya tiap paragraf paling banyak `maxWords` kata.
 *
 * KENAPA KATA, BUKAN BARIS. "Tiga sampai empat baris" bergantung pada ukuran
 * huruf dan lebar layar, sedangkan jumlah kata tetap di HP mana pun.
 *
 * Kalimat tidak pernah dipotong di tengah: satu kalimat yang lebih panjang dari
 * batasnya tetap jadi satu paragraf utuh. Potongan yang terputus di tengah
 * kalimat (khas hasil OCR yang memecah per baris cetak) disambung dulu ke
 * potongan berikutnya, baru dibagi per kalimat. `null` berarti tanpa batas:
 * paragrafnya dikembalikan apa adanya.
 */
export function regroupParagraphs(paragraphs: string[], maxWords: number | null): string[] {
  if (maxWords === null) return paragraphs;

  /*
   * Disambung hanya kalau potongan sebelumnya belum menutup kalimat DAN potongan
   * ini diawali huruf kecil. Syarat kedua menjaga judul ("Tata Surya") tidak
   * ikut tertelan ke kalimat pertama di bawahnya.
   */
  const joined: string[] = [];
  for (const paragraph of paragraphs) {
    const last = joined.length - 1;
    if (last >= 0 && !SENTENCE_END.test(joined[last]) && /^\p{Ll}/u.test(paragraph)) {
      joined[last] = `${joined[last]} ${paragraph}`;
    } else {
      joined.push(paragraph);
    }
  }

  const result: string[] = [];
  for (const paragraph of joined) {
    // Tanda akhir kalimat dihitung hanya kalau diikuti spasi, supaya "3.5" utuh.
    const sentences = (paragraph.match(/\S.*?(?:[.!?]+["')\]]*(?=\s|$)|$)/g) ?? [paragraph])
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);

    let current = '';
    for (const sentence of sentences) {
      const next = current ? `${current} ${sentence}` : sentence;
      if (current && wordCount(next) > maxWords) {
        result.push(current);
        current = sentence;
      } else {
        current = next;
      }
    }
    if (current) result.push(current);
  }

  return result;
}
