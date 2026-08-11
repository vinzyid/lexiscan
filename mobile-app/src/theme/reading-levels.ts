import type { TypeLevelId } from './palettes';

/**
 * Tingkat kemampuan membaca pengguna — sumber dari mana seluruh penyesuaian
 * tampilan dan suara diturunkan.
 *
 * PENAMAANNYA. Kelompok asesmen mengklasifikasikan hasilnya sebagai kesulitan
 * membaca tinggi / sedang / rendah. Id di sini sengaja TIDAK memakai kata itu,
 * karena di dalam kode "tinggi" tidak pernah jelas merujuk kemampuan yang
 * tinggi atau kesulitan yang tinggi — dan salah membacanya berarti membalik
 * seluruh preset. Pemetaannya:
 *
 *   belum   ← kesulitan membaca TINGGI
 *   mengeja ← kesulitan membaca SEDANG
 *   lancar  ← kesulitan membaca RENDAH
 *
 * Harus sama persis dengan App\Models\Reader::readingLevels() dan
 * AiTextService::READING_LEVELS di backend.
 */
export type ReadingLevelId = 'belum' | 'mengeja' | 'lancar';

export type ReadingLevelPreset = {
  /** Nama & keterangannya ada di `src/i18n` (`t.readingLevels[id]`), bukan di sini. */
  id: ReadingLevelId;

  /** Preset tipografi yang dipasang: makin butuh bantuan, makin besar hurufnya. */
  typeLevelId: TypeLevelId;

  /**
   * Pecah tiap kata menjadi suku kata langsung di teks bacaan ("bu ka ba ca"),
   * tanpa perlu diketuk lebih dulu.
   */
  syllableSpacing: boolean;

  /** Tombol suara tersedia dan aktif. */
  ttsEnabled: boolean;

  /** Paragraf yang sedang aktif dibacakan sendiri tanpa ditekan. */
  ttsAutoPlay: boolean;

  /**
   * Tiap tombol menyebutkan namanya sendiri saat ditekan.
   *
   * Untuk yang belum bisa membaca, ikon dan tulisan di tombol sama-sama tidak
   * memberi tahu apa pun. Tanpa ini, satu-satunya cara mengetahui sebuah
   * tombol untuk apa adalah menekannya dan melihat akibatnya — yang berarti
   * belajar aplikasi dengan cara tersesat di dalamnya.
   */
  speakButtonLabels: boolean;

  /** Warna kata berselang-seling supaya mata tidak kehilangan baris. */
  bicolorWords: boolean;

  /**
   * Kecepatan bicara untuk expo-speech (1.0 = kecepatan normal perangkat).
   * Yang belum bisa membaca butuh jeda lebih panjang antar kata untuk
   * mencocokkan bunyi dengan huruf yang dilihatnya.
   */
  speechRate: number;
};

/**
 * Satu-satunya tabel preset. Semua layar membacanya dari sini, tidak ada yang
 * menyimpulkan sendiri dari `readingLevel`.
 *
 * Preset ini titik AWAL, bukan kunci. Begitu pengguna mengubah salah satu
 * pengaturannya sendiri, pilihannya menang dan preset tidak menimpanya lagi —
 * lihat `applyReadingLevelPreset` di `src/store/useStore.ts`. Dosen PLB
 * menegaskan fitur suara harus tetap bisa dimatikan, karena penyesuaian yang
 * dipaksakan justru membuat penggunanya tidak nyaman.
 */
export const READING_LEVELS: ReadingLevelPreset[] = [
  {
    id: 'belum',
    typeLevelId: 'berat',
    syllableSpacing: true,
    ttsEnabled: true,
    ttsAutoPlay: true,
    speakButtonLabels: true,
    bicolorWords: true,
    speechRate: 0.75,
  },
  {
    id: 'mengeja',
    typeLevelId: 'sedang',
    syllableSpacing: true,
    ttsEnabled: true,
    /*
     * Mati, dan itu perbedaan pokoknya dari 'belum'. Yang sudah bisa mengeja
     * sedang belajar memecahkan katanya sendiri; suara yang berbunyi duluan
     * setiap kali paragraf berganti mengambil alih pekerjaan itu. Tombolnya
     * tetap ada, jadi bantuan tinggal diminta saat mentok.
     */
    ttsAutoPlay: false,
    /* Mati: yang sudah bisa mengeja mampu membaca nama tombolnya sendiri,
       dan tiap ketukan yang berbunyi jadi gangguan, bukan bantuan. */
    speakButtonLabels: false,
    bicolorWords: true,
    speechRate: 0.85,
  },
  {
    id: 'lancar',
    typeLevelId: 'ringan',
    syllableSpacing: false,
    ttsEnabled: false,
    ttsAutoPlay: false,
    speakButtonLabels: false,
    bicolorWords: false,
    speechRate: 1,
  },
];

/** Bawaan bagi yang belum memilih: tengah-tengah, paling sedikit merugikan. */
export const DEFAULT_READING_LEVEL: ReadingLevelId = 'mengeja';

export const READING_LEVEL_IDS: ReadingLevelId[] = READING_LEVELS.map((level) => level.id);

export const isReadingLevelId = (value: unknown): value is ReadingLevelId =>
  READING_LEVELS.some((level) => level.id === value);

export const getReadingLevel = (id: ReadingLevelId): ReadingLevelPreset =>
  READING_LEVELS.find((level) => level.id === id) ?? READING_LEVELS[1];
