import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Hasil penyederhanaan yang disimpan di HP, supaya teks yang sudah pernah
 * disederhanakan bisa dibuka lagi seketika dan tanpa internet.
 *
 * Backend sudah punya cache sendiri, tetapi jawabannya tetap butuh jaringan
 * dan sekitar satu detik perjalanan pulang-pergi. Bagi pembaca yang cepat
 * kehilangan fokus, dan di sekolah yang sinyalnya lemah, itu yang terasa.
 *
 * Kuncinya isi teks, bukan id dokumen: halaman yang sama yang dipindai ulang,
 * atau dokumen contoh, ikut memakai hasil yang sama.
 *
 * Disimpan di kunci AsyncStorage sendiri, terpisah dari `lexiscan-store`. Di
 * Android satu nilai yang terlalu besar (sekitar 2 MB) gagal dibaca, dan kalau
 * cache ini menumpang di store utama, riwayat dokumen dan seluruh preferensi
 * ikut gagal dimuat.
 */

const STORAGE_KEY = 'lexiscan-simplify-cache';

/**
 * Naikkan setiap aturan penyederhanaan di backend berubah. Backend membuang
 * cache-nya sendiri otomatis karena kuncinya memuat sidik jari prompt, tetapi
 * HP tidak tahu promptnya, jadi hasil lama di sini harus dibuang dengan tangan.
 */
const CACHE_VERSION = 3;

/** Pagar ukuran: yang paling lama tidak dibuka dibuang lebih dulu. */
const MAX_ENTRIES = 120;
const MAX_TOTAL_CHARS = 400_000;

interface Entry {
  paragraphs: string[];
  /** Terakhir dipakai (epoch ms), untuk menentukan yang dibuang lebih dulu. */
  usedAt: number;
}

interface Stored {
  version: number;
  entries: Record<string, Entry>;
}

/** Dibaca sekali lalu dipakai ulang, sama seperti `currentDeviceId`. */
let loaded: Promise<Record<string, Entry>> | null = null;

function entries(): Promise<Record<string, Entry>> {
  loaded ??= load();

  return loaded;
}

async function load(): Promise<Record<string, Entry>> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Stored) : null;

    // Versi lama berarti dibuat dengan aturan yang sudah diganti: dibuang semua.
    return parsed?.version === CACHE_VERSION && parsed.entries ? parsed.entries : {};
  } catch {
    // Cache hanya penghematan; penyimpanan yang rusak tidak boleh menghentikan fitur.
    return {};
  }
}

async function persist(map: Record<string, Entry>): Promise<void> {
  try {
    const stored: Stored = { version: CACHE_VERSION, entries: map };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Gagal menyimpan hanya berarti permintaan berikutnya lewat jaringan lagi.
  }
}

/** cyrb53: hash 53-bit yang cukup untuk kunci cache, tanpa modul native. */
function hash(text: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Semua yang membuat jawaban backend berbeda ikut jadi bagian kunci: level,
 * bahasa, dan kemampuan membaca. Panjang teks ikut supaya tabrakan hash makin
 * mustahil.
 */
export function simplifyCacheKey(
  text: string,
  level: string,
  language: string,
  readingLevel: string,
): string {
  return `${language}:${readingLevel}:${level}:${text.length}:${hash(text)}`;
}

export async function readSimplified(key: string): Promise<string[] | null> {
  const map = await entries();
  const hit = map[key];

  if (!hit || !Array.isArray(hit.paragraphs) || hit.paragraphs.length === 0) {
    return null;
  }

  hit.usedAt = Date.now();
  void persist(map);

  return hit.paragraphs;
}

export async function writeSimplified(key: string, paragraphs: string[]): Promise<void> {
  const map = await entries();
  map[key] = { paragraphs, usedAt: Date.now() };

  // Yang paling lama tidak dipakai dibuang sampai jumlah dan ukurannya masuk pagar.
  const keys = Object.keys(map).sort((a, b) => map[b].usedAt - map[a].usedAt);
  let total = 0;

  keys.forEach((k, index) => {
    total += map[k].paragraphs.reduce((sum, p) => sum + p.length, 0);

    if (index >= MAX_ENTRIES || total > MAX_TOTAL_CHARS) {
      delete map[k];
    }
  });

  await persist(map);
}
