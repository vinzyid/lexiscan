import type { LanguageId } from '../store/useStore';

const VOWELS = 'aeiouAEIOU';
/** Digraf yang mewakili satu bunyi konsonan, jadi tidak boleh dipotong. */
const DIGRAPHS = ['ng', 'ny', 'kh', 'sy', 'th', 'dh'];

const isVowel = (char: string) => VOWELS.includes(char);
const isDigraphAt = (word: string, index: number) =>
  DIGRAPHS.includes(word.slice(index, index + 2).toLowerCase());

/**
 * Aturannya dipisah per bahasa: pola Indonesia KV/KVK menghasilkan "rea-ding"
 * untuk kata Inggris, padahal yang benar "read-ing".
 */
/**
 * Kata dasar berawal vokal yang lazim mendapat awalan meng-/peng-.
 *
 * Pemenggalan resmi (PUEBI) memisahkan imbuhan dari kata dasarnya lebih dulu:
 * "mengorbit" adalah meng+orbit, jadi "meng-or-bit" - bukan "me-ngor-bit" yang
 * dihasilkan aturan bunyi di bawah.
 *
 * KENAPA DAFTAR, BUKAN ATURAN. "meng" + vokal tidak selalu berarti kata dasar
 * berawal vokal: "mengirim" adalah meng+kirim yang huruf k-nya luluh, dan
 * dipenggal "me-ngi-rim". Bentuk tulisannya sama persis dengan "mengikuti"
 * (meng+ikut), jadi aturan yang menebak akan memperbaiki satu dan merusak yang
 * lain. Kata dasar yang tidak ada di sini tetap memakai aturan bunyi.
 *
 * Ditulis huruf kecil semua; pencocokannya mengabaikan besar-kecil huruf.
 */
const VOWEL_ROOTS = new Set([
  'abai', 'abdi', 'ada', 'adu', 'ajak', 'ajar', 'aju', 'akhir', 'aku', 'alam',
  'alih', 'alir', 'amat', 'ambil', 'amuk', 'ancam', 'anggap', 'angkat', 'angkut',
  'antar', 'anjur', 'arah', 'asuh', 'atur', 'awas', 'ayun', 'edar', 'elak', 'elus',
  'embus', 'ikat', 'ikut', 'ingat', 'inap', 'intip', 'iris', 'isi', 'isap', 'obat',
  'obrol', 'olah', 'oles', 'orbit', 'ubah', 'ucap', 'ukur', 'ulang', 'umpat',
  'undang', 'unduh', 'unggah', 'unggul', 'urai', 'urang', 'urus', 'usap', 'usir',
  'utus',
]);

/** Akhiran yang boleh menempel di belakang kata dasar pada `VOWEL_ROOTS`. */
const ROOT_SUFFIXES = ['', 'i', 'an', 'kan', 'nya', 'inya', 'kannya', 'lah', 'kah'];

/**
 * Pisahkan awalan meng-/peng- kalau sisanya kata dasar berawal vokal yang
 * dikenal. `null` berarti bukan kasus ini, dan aturan bunyi yang berlaku.
 */
function splitVowelRootPrefix(clean: string): string[] | null {
  const lower = clean.toLowerCase();
  if (!lower.startsWith('meng') && !lower.startsWith('peng')) return null;

  const rest = lower.slice(4);
  const known = ROOT_SUFFIXES.some(
    (suffix) => rest.endsWith(suffix) && VOWEL_ROOTS.has(rest.slice(0, rest.length - suffix.length)),
  );
  if (!known) return null;

  // Huruf aslinya yang dipakai, supaya "Mengorbit" di awal kalimat tetap kapital.
  return [clean.slice(0, 4), ...splitIndonesian(clean.slice(4))];
}

export function splitSyllables(word: string, language: LanguageId = 'id'): string[] {
  const clean = word.replace(/[^\p{L}\p{N}-]/gu, '');
  if (clean.length < 3) return clean ? [clean] : [];

  /*
   * Dicocokkan sebelum apa pun, tapi HANYA untuk bahasa Indonesia — daftar ini
   * berisi kaidah imbuhan Indonesia, dan kata Inggris yang kebetulan sama
   * ejaannya tidak boleh ikut terkena.
   */
  if (language === 'id') {
    const prefixed = splitVowelRootPrefix(clean);
    if (prefixed) return prefixed;
  }

  if (clean.includes(HYPHEN)) return splitHyphenated(clean, language);

  return language === 'en' ? splitEnglish(clean) : splitIndonesian(clean);
}

const HYPHEN = '-';

/**
 * Kata bertanda hubung dipenggal per bagian, lalu tanda hubungnya ditempelkan
 * ke ujung bagian sebelumnya.
 *
 * Tanpa ini "anak-anak" keluar sebagai "a nak -a nak": tanda hubungnya menempel
 * di AWAL suku kata berikutnya sehingga terbaca seperti tanda minus, padahal
 * tugasnya menutup bagian sebelumnya. Dulu tidak terlihat karena pemenggalan
 * hanya muncul saat kata diketuk; sekarang ia tampil di setiap kata.
 */
function splitHyphenated(clean: string, language: LanguageId): string[] {
  const parts: string[] = [];

  clean.split(HYPHEN).forEach((segment, index, all) => {
    if (segment.length > 0) parts.push(...splitSyllables(segment, language));

    if (index === all.length - 1) return;

    // Bagian kosong (mis. "--") membuat tanda hubungnya berdiri sendiri, supaya
    // tidak ada karakter yang hilang dari kata aslinya.
    if (parts.length > 0) parts[parts.length - 1] += HYPHEN;
    else parts.push(HYPHEN);
  });

  return parts;
}

/**
 * Pemenggalan suku kata bahasa Indonesia dengan pola KV / KVK / V / VK.
 * Cukup untuk fitur Sorot Satu Kata (menampilkan kata besar + suku katanya);
 * bukan pengganti kamus, kata serapan tidak baku bisa meleset.
 */
function splitIndonesian(clean: string): string[] {

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
      /*
       * Digraf tepat setelah vokal, dan letaknya menentukan.
       *
       * Kalau ia SATU-SATUNYA gugus, ia membuka suku kata berikutnya:
       * "ba-ngun", "me-nya-pu". Tapi kalau masih ada konsonan lain sesudahnya,
       * ia justru menutup suku kata ini dan konsonan sisanya yang membuka yang
       * berikutnya: "meng-ha-sil-kan", "bang-sa", "bang-ku".
       *
       * Tanpa pembedaan ini "menghasilkan" terpenggal jadi "me-ngha-sil-kan" —
       * tidak ada suku kata "ngha" dalam bahasa Indonesia.
       */
      boundaries.push(consonants === 2 ? i + 1 : i + 3);
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

const EN_VOWELS = 'aeiouy';

/**
 * Hanya digraf sejati. Gugus seperti `st`/`sk` sengaja tidak masuk: di tengah
 * kata gugus itu justru terbelah ("bas-ket", "sis-ter").
 */
const EN_DIGRAPHS = ['ch', 'sh', 'th', 'ph', 'wh', 'gh', 'ck', 'ng', 'qu'];

/** `y` berbunyi vokal di mana saja kecuali di awal kata ("yes" vs "happy"). */
const isEnglishVowel = (lower: string, index: number) =>
  EN_VOWELS.includes(lower[index]) && !(lower[index] === 'y' && index === 0);

/**
 * Heuristik berbasis gugus vokal, bukan kamus. Tiga perkecualian yang
 * ditangani: `e` bisu di akhir, akhiran `-le` ("ta-ble"), akhiran `-ing`.
 */
function splitEnglish(clean: string): string[] {
  const lower = clean.toLowerCase();

  const groups: [number, number][] = [];
  let index = 0;
  while (index < lower.length) {
    if (isEnglishVowel(lower, index)) {
      const start = index;
      while (index < lower.length && isEnglishVowel(lower, index)) index += 1;
      groups.push([start, index]);
    } else {
      index += 1;
    }
  }

  if (groups.length <= 1) return [clean];

  const endsWithConsonantLe =
    lower.length >= 3 && lower.endsWith('le') && !isEnglishVowel(lower, lower.length - 3);

  if (!endsWithConsonantLe) {
    const last = groups[groups.length - 1];
    const isFinalLoneE =
      last[1] === lower.length && last[1] - last[0] === 1 && lower[last[0]] === 'e';
    if (isFinalLoneE) groups.pop();
  }

  if (groups.length <= 1) return [clean];

  const cuts: number[] = [];

  const hasIngSuffix =
    lower.endsWith('ing') && lower.length >= 6 && !isEnglishVowel(lower, lower.length - 4);
  if (hasIngSuffix) cuts.push(lower.length - 3);

  for (let g = 0; g < groups.length - 1; g += 1) {
    // Akhiran -ing sudah menentukan potongan terakhirnya sendiri.
    if (hasIngSuffix && groups[g + 1][0] >= lower.length - 3) continue;

    const runStart = groups[g][1];
    const runEnd = groups[g + 1][0];
    const run = runEnd - runStart;

    if (run <= 0) continue;

    if (run === 1) {
      cuts.push(runStart); // V-KV, mis. "wa-ter"
      continue;
    }

    // Digraf ikut utuh ke suku kata berikutnya: "ma-chine", "chil-dren".
    if (EN_DIGRAPHS.includes(lower.slice(runEnd - 2, runEnd))) {
      cuts.push(runEnd - 2);
      continue;
    }

    if (run === 2 && EN_DIGRAPHS.includes(lower.slice(runStart, runStart + 2))) {
      cuts.push(runStart);
      continue;
    }

    cuts.push(runStart + 1); // VK-KV, mis. "but-ter"
  }

  // Potongan lain di wilayah "-le" dibuang, kalau tidak "table" jadi "ta-b-le".
  if (endsWithConsonantLe) {
    const leCut = lower.length - 3;
    if (leCut > 0) {
      const kept = cuts.filter((cut) => cut < leCut);
      cuts.length = 0;
      cuts.push(...kept, leCut);
    }
  }

  const parts: string[] = [];
  let start = 0;
  for (const cut of cuts) {
    if (cut > start && cut < clean.length) {
      parts.push(clean.slice(start, cut));
      start = cut;
    }
  }
  parts.push(clean.slice(start));

  return parts.filter((part) => part.length > 0);
}
