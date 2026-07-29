/**
 * Token warna & tipografi, diambil langsung dari file Figma "Final Desain".
 *
 * Figma menyediakan tiga baris tema penuh (Dark Mode, Warm Cream, Soft Green).
 * Dua tema sisanya (Kuning Lembut, Biru Pastel) hanya muncul di kartu pemilih
 * tema pada layar Pengaturan — nilai bg/teksnya diambil dari kartu itu dan
 * surface-nya diturunkan memakai rumus yang sama dengan tema lain.
 *
 * Nilai warna disimpan sebagai channel RGB ("124 58 237") karena dipakai lewat
 * CSS variable + `rgb(var(--x) / <alpha-value>)` di tailwind.config.js.
 */
export type ThemeId = 'krem' | 'kuning' | 'biru' | 'hijau' | 'gelap';

export type ThemeTokens = {
  background: string;
  surface: string;
  surfaceAlt: string;
  textMain: string;
  textMuted: string;
  /**
   * Sama dengan textMain. Di Figma garis pemisah selalu textMain @ 8%, jadi di
   * kode selalu dipakai dengan opacity — `border-border/10`, bukan `border-border`.
   */
  border: string;
  primary: string;
  primaryDeep: string;
  primarySoft: string;
  highlight: string;
  warm: string;
  success: string;
  /*
   * Bicolor Words: kata ganjil memakai bicolorA (= textMain), kata genap
   * bicolorB. Nilai krem & gelap diambil apa adanya dari styleOverrideTable
   * layar Bicolor di Figma; tiga tema lain memakai campuran yang sama
   * (60% dari textMain menuju textMuted).
   */
  bicolorA: string;
  bicolorB: string;
};

export type ThemeDef = {
  id: ThemeId;
  name: string;
  /** Tiga titik contoh warna di kartu pemilih tema (Figma: 10x10, r=5). */
  swatches: [string, string, string];
  /** Kotak pratinjau 48x38 di kiri kartu pemilih tema. */
  preview: { fill: string; stroke: string };
  /** Latar kartu pemilih tema — gradien dari warna latar tema ke aksennya. */
  cardGradient: readonly [string, string];
  isDark: boolean;
  tokens: ThemeTokens;
};

/*
 * Aksen ungu/oranye/hijau identik di semua tema — Figma memakai nilai yang
 * persis sama di ketiga baris tema, jadi hanya permukaan & teks yang berganti.
 */
const ACCENTS = {
  primary: '124 58 237', // #7c3aed
  primaryDeep: '109 40 217', // #6d28d9
  warm: '245 158 11', // #f59e0b
  success: '16 185 129', // #10b981
} as const;

export const THEMES: ThemeDef[] = [
  {
    id: 'krem',
    name: 'Krem Hangat',
    swatches: ['#9b7a4a', '#7c3aed', '#7c3aed'],
    preview: { fill: '#fdf8f2', stroke: '#241908' },
    cardGradient: ['#fdf8f2', '#f0e0c8'],
    isDark: false,
    tokens: {
      background: '253 248 242', // #fdf8f2
      surface: '255 255 255', // #ffffff
      surfaceAlt: '247 240 231',
      textMain: '36 25 8', // #241908
      textMuted: '160 128 80', // #a08050
      border: '36 25 8',
      primarySoft: '243 237 254',
      highlight: '254 243 199',
      bicolorA: '36 25 8',
      bicolorB: '124 90 40', // #7c5a28

      ...ACCENTS,
    },
  },
  {
    id: 'kuning',
    name: 'Kuning Lembut',
    swatches: ['#8b7520', '#d97706', '#7c3aed'],
    preview: { fill: '#fffbea', stroke: '#2e2400' },
    cardGradient: ['#fffbea', '#fff0a0'],
    isDark: false,
    tokens: {
      background: '255 251 234', // #fffbea
      surface: '255 253 245',
      surfaceAlt: '252 245 218',
      textMain: '46 36 0', // #2e2400
      textMuted: '139 117 32', // #8b7520
      border: '46 36 0',
      primarySoft: '243 237 254',
      highlight: '253 230 138',
      bicolorA: '46 36 0',
      bicolorB: '119 85 19',
      ...ACCENTS,
    },
  },
  {
    id: 'biru',
    name: 'Biru Pastel',
    swatches: ['#3b5f7a', '#4f46e5', '#7c3aed'],
    preview: { fill: '#edf4fb', stroke: '#0c1e30' },
    cardGradient: ['#edf4fb', '#c5deef'],
    isDark: false,
    tokens: {
      background: '237 244 251', // #edf4fb
      surface: '247 250 253',
      surfaceAlt: '225 236 247',
      textMain: '12 30 48', // #0c1e30
      textMuted: '59 95 122', // #3b5f7a
      border: '12 30 48',
      primarySoft: '237 237 254',
      highlight: '219 234 254',
      bicolorA: '12 30 48',
      bicolorB: '40 69 92',
      ...ACCENTS,
    },
  },
  {
    id: 'hijau',
    name: 'Hijau Lembut',
    swatches: ['#2e6a42', '#059669', '#7c3aed'],
    preview: { fill: '#eef7f1', stroke: '#0b2518' },
    cardGradient: ['#eef7f1', '#c2e8cc'],
    isDark: false,
    tokens: {
      background: '238 247 241', // #eef7f1
      surface: '245 251 247', // #f5fbf7
      surfaceAlt: '226 241 232',
      textMain: '11 37 24', // #0b2518
      textMuted: '46 106 66', // #2e6a42
      border: '11 37 24',
      primarySoft: '238 237 254',
      highlight: '217 240 224',
      bicolorA: '11 37 24',
      bicolorB: '34 79 50',
      ...ACCENTS,
    },
  },
  {
    id: 'gelap',
    name: 'Mode Gelap',
    swatches: ['#7070a0', '#7c3aed', '#7c3aed'],
    preview: { fill: '#111122', stroke: '#ffffff' },
    cardGradient: ['#1f2137', '#111122'],
    isDark: true,
    tokens: {
      background: '17 17 34', // #111122
      surface: '28 30 53', // #1c1e35
      surfaceAlt: '38 41 68',
      textMain: '232 232 248', // #e8e8f8
      textMuted: '112 112 160', // #7070a0
      border: '255 255 255',
      primarySoft: '46 38 82',
      highlight: '74 62 31',
      bicolorA: '232 232 248',
      bicolorB: '176 176 212', // #b0b0d4
      ...ACCENTS,
    },
  },
];

export const getTheme = (id: ThemeId): ThemeDef => THEMES.find((t) => t.id === id) ?? THEMES[0];

/**
 * Gradien Figma. Nilainya identik di ketiga baris tema, jadi tidak ikut
 * berganti saat pengguna mengubah palet — hanya permukaan & teks yang berganti.
 *
 * Dipakai lewat `<LinearGradient colors={...} locations={...} />`.
 */
export const GRADIENTS = {
  /** Banner utama dashboard & header profil. */
  hero: {
    colors: ['#4c1d95', '#5b21b6', '#1e40af'] as const,
    locations: [0, 0.45, 1] as const,
  },
  /** Header layar Baca — lebih gelap/kebiruan dari banner dashboard. */
  readerHeader: {
    colors: ['#1e1b4b', '#312e81', '#1e3a8a'] as const,
    locations: [0, 0.5, 1] as const,
  },
  /** Header kartu profil di Pengaturan. */
  profileHeader: {
    colors: ['#1e1b4b', '#312e81', '#0f172a'] as const,
    locations: [0, 0.5, 1] as const,
  },
  /** Avatar 44x44 di dashboard. */
  avatar: { colors: ['#7c3aed', '#4338ca'] as const, locations: [0, 1] as const },
  /** Avatar 64x64 di kartu profil — merah muda, bukan biru. */
  profileAvatar: { colors: ['#7c3aed', '#ec4899'] as const, locations: [0, 1] as const },
  /** Kepala kartu Word Isolation. */
  isolationSheet: { colors: ['#5b21b6', '#4338ca'] as const, locations: [0, 1] as const },
  /** Pil aktif: segmen level L1–L5, chip fitur baca, bilah judul dokumen. */
  activePill: { colors: ['#7c3aed', '#4f46e5'] as const, locations: [0, 1] as const },
  /** Pil tab aktif di Navigation. */
  navPill: { colors: ['#7c3aed', '#4f46e5'] as const, locations: [0, 1] as const },
  /** Aksen merek: kartu Bicolor Words, strip "TIP HARI INI", bilah judul seksi. */
  brand: {
    colors: ['#7c3aed', '#ec4899', '#f59e0b'] as const,
    locations: [0, 0.5, 1] as const,
  },
  /** Kartu Reading Ruler. */
  ruler: { colors: ['#b45309', '#f59e0b'] as const, locations: [0, 1] as const },
  /** Kartu Word Isolation. */
  isolation: { colors: ['#0d9488', '#4f46e5'] as const, locations: [0, 1] as const },
} as const;

/** Ubin ikon 52x52 tiap FeatureCard — satu gradien & satu warna panah per fitur. */
export const FEATURE_ACCENTS = {
  scan: { gradient: ['#7c3aed', '#ec4899'] as const, chevron: '#7c3aed' },
  typography: { gradient: ['#0ea5e9', '#4f46e5'] as const, chevron: '#4f46e5' },
  simplify: { gradient: ['#8b5cf6', '#06b6d4'] as const, chevron: '#8b5cf6' },
  focus: { gradient: ['#10b981', '#3b82f6'] as const, chevron: '#10b981' },
  explain: { gradient: ['#f59e0b', '#f43f5e'] as const, chevron: '#f59e0b' },
} as const;

/**
 * Empat sapuan radial samar di latar tiap layar (Figma: "Container" paling
 * bawah). Diterjemahkan jadi lingkaran blur absolut, bukan gradien radial,
 * karena RN tidak punya radial gradient bawaan.
 */
export const BACKDROP_WASHES = [
  { color: '#f59e0b', opacity: 0.04 },
  { color: '#10b981', opacity: 0.04 },
  { color: '#4f46e5', opacity: 0.05 },
  { color: '#7c3aed', opacity: 0.07 },
] as const;

/**
 * Tiga preset "Adaptive Typography", persis kartu di layar Pengaturan.
 *
 * `spacingLabel` adalah angka yang ditampilkan di chip "Spasi" pada kartu —
 * bukan nilai letterSpacing sebenarnya. Teks bacaan memakai Atkinson
 * Hyperlegible; preset Ringan memakai berat Regular, Sedang & Berat memakai
 * Bold untuk seluruh paragraf (sesuai Figma).
 */
export type TypeLevelId = 'ringan' | 'sedang' | 'berat';

export type TypeLevel = {
  id: TypeLevelId;
  name: string;
  desc: string;
  fontSize: number;
  lineHeightRatio: number;
  letterSpacing: number;
  /** Label chip "Spasi" di kartu Pengaturan. */
  spacingLabel: string;
  /** Seluruh paragraf memakai Atkinson Bold (preset Sedang & Berat). */
  bodyBold: boolean;
};

export const TYPE_LEVELS: TypeLevel[] = [
  {
    id: 'ringan',
    name: 'Ringan',
    desc: 'Ukuran & spasi sedikit lebih besar',
    fontSize: 16,
    lineHeightRatio: 1.85,
    letterSpacing: 0.96,
    spacingLabel: '2px',
    bodyBold: false,
  },
  {
    id: 'sedang',
    name: 'Sedang',
    desc: 'Spasi lebar, awal kata ditebalkan',
    fontSize: 18,
    lineHeightRatio: 2.1,
    letterSpacing: 1.08,
    spacingLabel: '5px',
    bodyBold: true,
  },
  {
    id: 'berat',
    name: 'Berat',
    desc: 'Aksesibilitas maksimal',
    fontSize: 21,
    lineHeightRatio: 2.4,
    letterSpacing: 1.26,
    spacingLabel: '9px',
    bodyBold: true,
  },
];

export const getTypeLevel = (id: TypeLevelId): TypeLevel =>
  TYPE_LEVELS.find((t) => t.id === id) ?? TYPE_LEVELS[1];
