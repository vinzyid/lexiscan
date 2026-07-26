const VOWELS = 'aeiouAEIOU';
/** Digraf yang mewakili satu bunyi konsonan, jadi tidak boleh dipotong. */
const DIGRAPHS = ['ng', 'ny', 'kh', 'sy', 'th', 'dh'];

const isVowel = (char: string) => VOWELS.includes(char);
const isDigraphAt = (word: string, index: number) =>
  DIGRAPHS.includes(word.slice(index, index + 2).toLowerCase());

/**
 * Pemenggalan suku kata bahasa Indonesia dengan pola KV / KVK / V / VK.
 * Cukup untuk fitur Word Isolation (menampilkan kata besar + suku katanya);
 * bukan pengganti kamus, kata serapan tidak baku bisa meleset.
 */
export function splitSyllables(word: string): string[] {
  const clean = word.replace(/[^\p{L}\p{N}-]/gu, '');
  if (clean.length < 3) return clean ? [clean] : [];

  const boundaries: number[] = [];

  for (let i = 0; i < clean.length - 1; i++) {
    if (!isVowel(clean[i])) continue;

    // Hitung deret konsonan setelah vokal ini.
    let j = i + 1;
    while (j < clean.length && !isVowel(clean[j])) j++;

    // Tidak ada vokal lagi setelahnya — sisanya menempel di suku kata terakhir.
    if (j >= clean.length) break;

    const consonants = j - (i + 1);

    if (consonants === 0) {
      // V-V, mis. "ma-in". Diftong dibiarkan utuh.
      const pair = clean.slice(i, i + 2).toLowerCase();
      if (!['ai', 'au', 'oi', 'ei'].includes(pair)) boundaries.push(i + 1);
    } else if (consonants === 1) {
      boundaries.push(i + 1); // V-KV
    } else if (isDigraphAt(clean, i + 1)) {
      boundaries.push(i + 1); // digraf ikut ke suku kata berikutnya: "ba-ngun"
    } else {
      boundaries.push(i + 2); // VK-KV, mis. "man-di"
    }
  }

  const parts: string[] = [];
  let start = 0;
  for (const boundary of boundaries) {
    if (boundary > start) {
      parts.push(clean.slice(start, boundary));
      start = boundary;
    }
  }
  parts.push(clean.slice(start));

  return parts.filter((part) => part.length > 0);
}
