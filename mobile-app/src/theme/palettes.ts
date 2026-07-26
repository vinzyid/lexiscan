/**
 * Palet "tema warna ramah disleksia" persis seperti mockup v1 (layar Pengaturan).
 * Putih terang murni bikin silau, jadi tiap palet memakai soft contrast.
 *
 * Nilai warna disimpan sebagai channel RGB ("113 72 252") karena dipakai
 * lewat CSS variable + `rgb(var(--x) / <alpha-value>)` di tailwind.config.js.
 */
export type ThemeId = 'krem' | 'kuning' | 'biru' | 'hijau' | 'gelap';

export type ThemeTokens = {
  background: string;
  surface: string;
  surfaceAlt: string;
  textMain: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryDeep: string;
  primarySoft: string;
  highlight: string;
  warm: string;
  success: string;
  bicolorA: string;
  bicolorB: string;
};

export type ThemeDef = {
  id: ThemeId;
  name: string;
  emoji: string;
  /** Tiga titik contoh warna di kartu pemilih tema. */
  swatches: [string, string, string];
  isDark: boolean;
  tokens: ThemeTokens;
};

export const THEMES: ThemeDef[] = [
  {
    id: 'krem',
    name: 'Krem Hangat',
    emoji: '🧡',
    swatches: ['#FDFBF7', '#EFE6D6', '#B08968'],
    isDark: false,
    tokens: {
      background: '253 251 247',
      surface: '255 255 255',
      surfaceAlt: '246 242 234',
      textMain: '45 45 45',
      textMuted: '122 117 108',
      border: '237 231 220',
      primary: '113 72 252',
      primaryDeep: '88 51 214',
      primarySoft: '241 235 255',
      highlight: '254 243 199',
      warm: '245 158 11',
      success: '34 197 94',
      bicolorA: '45 45 45',
      bicolorB: '113 72 252',
    },
  },
  {
    id: 'kuning',
    name: 'Kuning Lembut',
    emoji: '🌻',
    swatches: ['#FEF9E7', '#F6E7B4', '#B4914A'],
    isDark: false,
    tokens: {
      background: '254 249 231',
      surface: '255 253 246',
      surfaceAlt: '251 243 220',
      textMain: '51 48 42',
      textMuted: '126 120 105',
      border: '240 231 204',
      primary: '113 72 252',
      primaryDeep: '88 51 214',
      primarySoft: '242 236 255',
      highlight: '253 230 138',
      warm: '217 119 6',
      success: '34 197 94',
      bicolorA: '51 48 42',
      bicolorB: '113 72 252',
    },
  },
  {
    id: 'biru',
    name: 'Biru Pastel',
    emoji: '💙',
    swatches: ['#EFF6FF', '#CFE3F8', '#4A7DB5'],
    isDark: false,
    tokens: {
      background: '239 246 255',
      surface: '249 252 255',
      surfaceAlt: '227 239 251',
      textMain: '36 48 61',
      textMuted: '107 124 142',
      border: '216 231 246',
      primary: '113 72 252',
      primaryDeep: '88 51 214',
      primarySoft: '235 236 255',
      highlight: '219 234 254',
      warm: '234 138 32',
      success: '22 163 74',
      bicolorA: '36 48 61',
      bicolorB: '113 72 252',
    },
  },
  {
    id: 'hijau',
    name: 'Hijau Lembut',
    emoji: '🌿',
    swatches: ['#EEF7F0', '#CFE7D6', '#4C8A63'],
    isDark: false,
    tokens: {
      background: '238 247 240',
      surface: '248 252 249',
      surfaceAlt: '225 240 230',
      textMain: '36 51 42',
      textMuted: '107 127 113',
      border: '214 233 220',
      primary: '113 72 252',
      primaryDeep: '88 51 214',
      primarySoft: '236 236 255',
      highlight: '217 240 224',
      warm: '202 138 4',
      success: '22 163 74',
      bicolorA: '36 51 42',
      bicolorB: '113 72 252',
    },
  },
  {
    id: 'gelap',
    name: 'Mode Gelap',
    emoji: '🌙',
    swatches: ['#16162B', '#2B2B48', '#9B7BFF'],
    isDark: true,
    tokens: {
      background: '22 22 43',
      surface: '33 33 58',
      surfaceAlt: '43 43 72',
      textMain: '236 234 246',
      textMuted: '155 152 181',
      border: '51 50 90',
      primary: '139 106 255',
      primaryDeep: '113 72 252',
      primarySoft: '46 38 82',
      highlight: '74 62 31',
      warm: '251 191 36',
      success: '74 222 128',
      bicolorA: '236 234 246',
      bicolorB: '183 160 255',
    },
  },
];

export const getTheme = (id: ThemeId): ThemeDef =>
  THEMES.find((t) => t.id === id) ?? THEMES[0];

/**
 * Tiga preset "Adaptive Typography". Angka spasi adalah pengali line-height,
 * bukan piksel — minimal 1.5 sesuai design-system.md agar tidak visual crowding.
 */
export type TypeLevelId = 'ringan' | 'sedang' | 'berat';

export type TypeLevel = {
  id: TypeLevelId;
  name: string;
  desc: string;
  fontSize: number;
  lineHeightRatio: number;
  letterSpacing: number;
  /** Tebalkan awal kata (visual fixation) — hanya di level Sedang & Berat. */
  boldFixation: boolean;
};

export const TYPE_LEVELS: TypeLevel[] = [
  {
    id: 'ringan',
    name: 'Ringan',
    desc: 'Ukuran & spasi sedikit lebih besar',
    fontSize: 16,
    lineHeightRatio: 1.85,
    letterSpacing: 0.3,
    boldFixation: false,
  },
  {
    id: 'sedang',
    name: 'Sedang',
    desc: 'Spasi lebar, awal kata ditebalkan',
    fontSize: 18,
    lineHeightRatio: 2.1,
    letterSpacing: 0.6,
    boldFixation: true,
  },
  {
    id: 'berat',
    name: 'Berat',
    desc: 'Aksesibilitas maksimal',
    fontSize: 21,
    lineHeightRatio: 2.4,
    letterSpacing: 0.9,
    boldFixation: true,
  },
];

export const getTypeLevel = (id: TypeLevelId): TypeLevel =>
  TYPE_LEVELS.find((t) => t.id === id) ?? TYPE_LEVELS[1];
