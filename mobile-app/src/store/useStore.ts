import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { THEMES, TYPE_LEVELS, type ThemeId, type TypeLevelId } from '../theme/palettes';
import {
  DEFAULT_READING_LEVEL,
  getReadingLevel,
  type ReadingLevelId,
} from '../theme/reading-levels';
import type { SimplifyLevelId } from '../data/sample-document';

/** Didefinisikan di sini, bukan di `src/i18n`, supaya tidak saling mengimpor. */
export type LanguageId = 'id' | 'en';

/**
 * Blok `footprint` yang dikirim backend di setiap respons AI. Bentuknya
 * mengikuti App\Services\Ai\Footprint::toArray() apa adanya.
 *
 * Dua pasang angka, dan bedanya penting: energy_wh/co2e_g adalah yang benar-
 * benar dikeluarkan permintaan itu, sedangkan avoided_* adalah yang TIDAK jadi
 * dikeluarkan karena jawabannya diambil dari cache backend. Satu permintaan
 * hanya mengisi salah satunya.
 */
export interface FootprintSample {
  /** Selalu true: ini taksiran bermetodologi terbuka, bukan hasil pengukuran. */
  estimated: boolean;
  /** false kalau penyedia tidak melaporkan token, sehingga angkanya tak berdasar. */
  known: boolean;
  cached: boolean;
  method: string;
  energy_wh: number;
  co2e_g: number;
  avoided_energy_wh: number;
  avoided_co2e_g: number;
  tokens: { input: number; output: number; total: number };
}

/** Akumulasi seluruh pemakaian AI di perangkat ini. */
export interface FootprintTotals {
  requests: number;
  /** Bagian dari `requests` yang dilayani cache backend, jadi tanpa emisi baru. */
  cachedRequests: number;
  energyWh: number;
  co2eG: number;
  avoidedEnergyWh: number;
  avoidedCo2eG: number;
}

/**
 * Bawaan tampilan yang diatur admin dari dashboard, dikirim backend di field
 * `defaults` pada GET /api/ai/health. Nilainya sengaja bertipe longgar: yang
 * datang dari jaringan belum tentu salah satu id yang dikenal aplikasi ini.
 */
export interface ServerDefaults {
  theme?: string | null;
  type_level?: string | null;
}

const isThemeId = (value: unknown): value is ThemeId =>
  THEMES.some((theme) => theme.id === value);

const isTypeLevelId = (value: unknown): value is TypeLevelId =>
  TYPE_LEVELS.some((level) => level.id === value);

const EMPTY_TOTALS: FootprintTotals = {
  requests: 0,
  cachedRequests: 0,
  energyWh: 0,
  co2eG: 0,
  avoidedEnergyWh: 0,
  avoidedCo2eG: 0,
};

interface OCRState {
  /** Bahasa antarmuka sekaligus bahasa jawaban AI; ikut dikirim ke backend. */
  language: LanguageId;
  setLanguage: (language: LanguageId) => void;

  /** Teks mentah hasil OCR; kosong berarti pengguna masih memakai dokumen contoh. */
  rawText: string;
  setRawText: (text: string) => void;
  clearRawText: () => void;

  /**
   * Hasil penyederhanaan AI per level. Dikosongkan setiap rawText berganti
   * supaya hasil dokumen sebelumnya tidak ikut tampil.
   */
  aiParagraphs: Partial<Record<SimplifyLevelId, string[]>>;
  setAiParagraphs: (level: SimplifyLevelId, paragraphs: string[]) => void;

  /** Jejak karbon permintaan AI terakhir; untuk chip di samping hasilnya. */
  lastFootprint: FootprintSample | null;
  /** Akumulasi sepanjang pemakaian; bertahan setelah aplikasi ditutup. */
  footprintTotals: FootprintTotals;
  recordFootprint: (sample: FootprintSample) => void;
  resetFootprintTotals: () => void;

  /**
   * Kemampuan membaca pengguna — dipilih saat mendaftar, bisa diubah kapan saja
   * dari Pengaturan. Dari sinilah tipografi, pemenggalan suku kata, dan suara
   * di bawah diturunkan.
   */
  readingLevel: ReadingLevelId;
  /**
   * Pasang seluruh preset milik satu tingkat sekaligus.
   *
   * Dipanggil hanya saat tingkatnya BERGANTI: sesudah itu setiap sakelar yang
   * disentuh pengguna menang dan tidak pernah ditimpa lagi. Kalau preset ikut
   * berjalan di tiap pembukaan aplikasi, pengguna yang mematikan suara akan
   * menemukannya menyala lagi esok hari.
   */
  applyReadingLevelPreset: (level: ReadingLevelId) => void;

  /** Tampilan */
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  typeLevelId: TypeLevelId;
  setTypeLevelId: (id: TypeLevelId) => void;
  /**
   * Pecah tiap kata menjadi suku kata langsung di teks bacaan ("bu ka ba ca"),
   * tanpa perlu mengetuk katanya lebih dulu.
   */
  syllableSpacing: boolean;
  setSyllableSpacing: (value: boolean) => void;
  /**
   * Sudah pernahkah pengguna mengatur tema/tipografinya sendiri. Menjadi
   * penentu apakah bawaan dari server masih boleh dipakai.
   */
  preferencesTouched: boolean;
  applyServerDefaults: (defaults: ServerDefaults) => void;

  /**
   * Pengguna sudah pernah memilih "lihat-lihat dulu" alih-alih mendaftar.
   *
   * Tanpa penanda ini, layar daftar muncul lagi setiap kali aplikasi dibuka —
   * dan menagih terus-menerus orang yang sudah menolak sekali adalah cara
   * tercepat membuat aplikasinya ditinggalkan.
   */
  authPromptDismissed: boolean;
  dismissAuthPrompt: () => void;

  /** Suara */
  ttsEnabled: boolean;
  setTtsEnabled: (value: boolean) => void;
  /** Bacakan paragraf aktif sendiri, tanpa menunggu tombol ditekan. */
  ttsAutoPlay: boolean;
  setTtsAutoPlay: (value: boolean) => void;

  /**
   * Pengingat "Tips Belajar Harian" tiap pagi.
   *
   * Tidak diturunkan dari preset kemampuan membaca, berbeda dengan sakelar
   * suara di bawah: mau diingatkan atau tidak sama sekali bukan soal seberapa
   * lancar seseorang membaca.
   */
  dailyTipEnabled: boolean;
  setDailyTipEnabled: (value: boolean) => void;

  /** Tiap tombol menyebut namanya sendiri saat ditekan. */
  speakButtonLabels: boolean;
  setSpeakButtonLabels: (value: boolean) => void;

  /**
   * Kecepatan bicara pilihan pengguna; `null` berarti ikut preset kemampuan
   * membaca.
   *
   * ADA KARENA KEJERNIHAN TIDAK BISA DITEBAK DARI SINI. Mesin TTS bawaan
   * melar-melarkan suaranya di kecepatan rendah, dan seberapa parah itu berbeda
   * di tiap HP dan tiap suara. Preset memilih 0,75 untuk yang belum bisa
   * membaca dengan alasan yang benar — ia butuh jeda antar kata — tapi kalau di
   * HP tertentu justru jadi tidak terdengar jelas, yang paling tahu adalah orang
   * yang mendengarkannya, bukan tabel di kode.
   */
  speechRate: number | null;
  setSpeechRate: (rate: number | null) => void;

  /**
   * Suara mesin TTS pilihan pengguna, per bahasa. Kosong berarti biarkan
   * aplikasi memilihkan yang terbaik di HP ini.
   *
   * DISIMPAN PER BAHASA karena identifier-nya memang milik satu bahasa:
   * "id-id-x-idd-local" tidak berarti apa-apa saat antarmuka berbahasa
   * Inggris, dan menyimpannya di satu kolom berarti pilihan yang satu
   * menghapus pilihan yang lain setiap kali bahasanya berganti.
   *
   * TIDAK ikut ke server, berbeda dengan preferensi lain. Daftar suara berbeda
   * di tiap HP — mesin TTS-nya lain, data suaranya lain — jadi identifier yang
   * ikut pindah HP hampir pasti menunjuk suara yang tidak ada di sana.
   */
  voiceIds: Partial<Record<LanguageId, string>>;
  setVoiceId: (language: LanguageId, identifier: string | null) => void;

  /** Reader */
  simplifyLevel: SimplifyLevelId;
  setSimplifyLevel: (id: SimplifyLevelId) => void;
  focusMode: boolean;
  toggleFocusMode: () => void;
  rulerMode: boolean;
  toggleRulerMode: () => void;
  bicolorMode: boolean;
  toggleBicolorMode: () => void;
  activeParagraphIndex: number;
  setActiveParagraphIndex: (index: number) => void;
}

export const useOCRStore = create<OCRState>()(
  persist(
    (set) => ({
      language: 'id',
      // Hasil AI lama ikut dibuang karena paragrafnya masih berbahasa sebelumnya.
      setLanguage: (language) => set({ language, aiParagraphs: {} }),

      rawText: '',
      setRawText: (text) =>
        set({ rawText: text, simplifyLevel: 'L1', activeParagraphIndex: 0, aiParagraphs: {} }),
      clearRawText: () => set({ rawText: '', activeParagraphIndex: 0, aiParagraphs: {} }),

      aiParagraphs: {},
      setAiParagraphs: (level, paragraphs) =>
        set((s) => ({ aiParagraphs: { ...s.aiParagraphs, [level]: paragraphs } })),

      lastFootprint: null,
      footprintTotals: EMPTY_TOTALS,
      recordFootprint: (sample) =>
        set((s) => ({
          lastFootprint: sample,
          footprintTotals: {
            // Permintaannya tetap dihitung meski tokennya tidak dilaporkan:
            // yang tidak diketahui hanya besarnya, bukan kejadiannya.
            requests: s.footprintTotals.requests + 1,
            cachedRequests: s.footprintTotals.cachedRequests + (sample.cached ? 1 : 0),
            energyWh: s.footprintTotals.energyWh + sample.energy_wh,
            co2eG: s.footprintTotals.co2eG + sample.co2e_g,
            avoidedEnergyWh: s.footprintTotals.avoidedEnergyWh + sample.avoided_energy_wh,
            avoidedCo2eG: s.footprintTotals.avoidedCo2eG + sample.avoided_co2e_g,
          },
        })),
      resetFootprintTotals: () => set({ footprintTotals: EMPTY_TOTALS, lastFootprint: null }),

      readingLevel: DEFAULT_READING_LEVEL,
      applyReadingLevelPreset: (level) => {
        const preset = getReadingLevel(level);

        set({
          readingLevel: level,
          typeLevelId: preset.typeLevelId,
          syllableSpacing: preset.syllableSpacing,
          ttsEnabled: preset.ttsEnabled,
          ttsAutoPlay: preset.ttsAutoPlay,
          speakButtonLabels: preset.speakButtonLabels,
          speechRate: null,
          bicolorMode: preset.bicolorWords,
          /*
           * Bawaan dari admin tidak boleh lagi ikut campur setelah ini: preset
           * baru saja menetapkan tipografinya berdasarkan sesuatu yang jauh
           * lebih tahu, yaitu kemampuan membaca orangnya sendiri.
           */
          preferencesTouched: true,
        });
      },

      themeId: 'krem',
      setThemeId: (id) => set({ themeId: id, preferencesTouched: true }),
      typeLevelId: 'sedang',
      setTypeLevelId: (id) => set({ typeLevelId: id, preferencesTouched: true }),
      syllableSpacing: getReadingLevel(DEFAULT_READING_LEVEL).syllableSpacing,
      setSyllableSpacing: (value) => set({ syllableSpacing: value }),

      authPromptDismissed: false,
      dismissAuthPrompt: () => set({ authPromptDismissed: true }),

      ttsEnabled: getReadingLevel(DEFAULT_READING_LEVEL).ttsEnabled,
      setTtsEnabled: (value) =>
        // Mematikan suara ikut mematikan pembacaan otomatis, kalau tidak
        // sakelar induknya mati sementara akibatnya masih terdengar.
        set(value ? { ttsEnabled: true } : { ttsEnabled: false, ttsAutoPlay: false, speakButtonLabels: false }),
      ttsAutoPlay: getReadingLevel(DEFAULT_READING_LEVEL).ttsAutoPlay,
      // Menyalakan pembacaan otomatis tidak masuk akal saat suaranya mati.
      setTtsAutoPlay: (value) =>
        set(value ? { ttsAutoPlay: true, ttsEnabled: true } : { ttsAutoPlay: false }),

      dailyTipEnabled: false,
      setDailyTipEnabled: (value) => set({ dailyTipEnabled: value }),

      speakButtonLabels: getReadingLevel(DEFAULT_READING_LEVEL).speakButtonLabels,
      // Menyalakannya saat suara mati tidak masuk akal — tombolnya tidak akan
      // berbunyi juga, dan sakelar yang menyala tanpa akibat itu menyesatkan.
      setSpeakButtonLabels: (value) =>
        set(value ? { speakButtonLabels: true, ttsEnabled: true } : { speakButtonLabels: false }),

      speechRate: null,
      setSpeechRate: (rate) => set({ speechRate: rate }),

      voiceIds: {},
      setVoiceId: (language, identifier) =>
        set((s) => {
          const next = { ...s.voiceIds };

          // Dihapus, bukan disimpan sebagai null: kunci yang tidak ada berarti
          // "pilihkan otomatis", dan itu juga yang berlaku bagi pengguna baru.
          if (identifier === null) delete next[language];
          else next[language] = identifier;

          return { voiceIds: next };
        }),

      preferencesTouched: false,
      /*
       * Bawaan dari admin hanya berlaku bagi yang belum pernah memilih sendiri.
       * Tanpa penjagaan ini, setiap kali aplikasi dibuka pilihan pengguna akan
       * dikembalikan ke pilihan admin — persis kebalikan dari maksudnya.
       *
       * Id yang tidak dikenal diabaikan diam-diam, bukan dijadikan galat:
       * backend boleh saja mengenal tema yang belum ada di versi aplikasi ini.
       */
      applyServerDefaults: (defaults) =>
        set((s) => {
          if (s.preferencesTouched) {
            return {};
          }

          return {
            ...(isThemeId(defaults.theme) ? { themeId: defaults.theme } : {}),
            ...(isTypeLevelId(defaults.type_level) ? { typeLevelId: defaults.type_level } : {}),
          };
        }),

      simplifyLevel: 'L1',
      setSimplifyLevel: (id) => set({ simplifyLevel: id }), // Dihapus activeParagraphIndex: 0 agar tidak meloncat ke atas saat ganti level
      focusMode: false,
      toggleFocusMode: () =>
        set((s) => ({ focusMode: !s.focusMode })), // Dihapus activeParagraphIndex: 0 agar tidak reset
      rulerMode: false,
      toggleRulerMode: () => set((s) => ({ rulerMode: !s.rulerMode })),
      bicolorMode: false,
      toggleBicolorMode: () => set((s) => ({ bicolorMode: !s.bicolorMode })),
      activeParagraphIndex: 0,
      setActiveParagraphIndex: (index) => set({ activeParagraphIndex: Math.max(0, index) }),
    }),
    {
      name: 'lexiscan-store',
      storage: createJSONStorage(() => AsyncStorage),
      /*
       * Yang disimpan ke disk hanya total jejak karbon dan preferensi tampilan.
       * Sisanya — teks hasil scan, hasil AI, posisi baca — memang layak hilang
       * saat aplikasi ditutup, dan menyimpannya justru membuat aplikasi membuka
       * dokumen lama yang tidak diminta.
       *
       * `preferencesTouched` ikut disimpan bersama tema dan tipografinya, dan
       * memang harus bertiga: kalau pilihan pengguna hilang saat aplikasi
       * ditutup sementara penandanya bertahan, ia justru terkunci di bawaan
       * pabrik dan tidak pernah lagi menerima bawaan dari admin.
       */
      partialize: (s) => ({
        footprintTotals: s.footprintTotals,
        themeId: s.themeId,
        typeLevelId: s.typeLevelId,
        preferencesTouched: s.preferencesTouched,

        /*
         * Kemampuan membaca beserta seluruh turunannya ikut disimpan, dan itu
         * wajib: preset hanya berjalan saat tingkatnya berganti, jadi kalau
         * turunannya hilang saat aplikasi ditutup, tidak ada yang akan
         * memasangnya kembali — pengguna yang belum bisa membaca akan membuka
         * aplikasi tanpa suara dan tanpa pemenggalan suku kata.
         */
        readingLevel: s.readingLevel,
        syllableSpacing: s.syllableSpacing,
        ttsEnabled: s.ttsEnabled,
        ttsAutoPlay: s.ttsAutoPlay,
        dailyTipEnabled: s.dailyTipEnabled,
        speakButtonLabels: s.speakButtonLabels,
        speechRate: s.speechRate,
        voiceIds: s.voiceIds,
        bicolorMode: s.bicolorMode,
        authPromptDismissed: s.authPromptDismissed,
      }),
    },
  ),
);
