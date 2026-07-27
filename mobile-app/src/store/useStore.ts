import { create } from 'zustand';
import type { ThemeId, TypeLevelId } from '../theme/palettes';
import type { SimplifyLevelId } from '../data/sample-document';

interface OCRState {
  /** Teks mentah hasil OCR; kosong berarti pengguna masih memakai dokumen contoh. */
  rawText: string;
  setRawText: (text: string) => void;
  clearRawText: () => void;

  /**
   * Hasil penyederhanaan AI per level untuk teks pindaian saat ini.
   * Ikut dikosongkan setiap rawText berganti supaya tidak menampilkan
   * hasil dokumen sebelumnya.
   */
  aiParagraphs: Partial<Record<SimplifyLevelId, string[]>>;
  setAiParagraphs: (level: SimplifyLevelId, paragraphs: string[]) => void;

  /** Tampilan */
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  typeLevelId: TypeLevelId;
  setTypeLevelId: (id: TypeLevelId) => void;

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

export const useOCRStore = create<OCRState>((set) => ({
  rawText: '',
  setRawText: (text) =>
    set({ rawText: text, simplifyLevel: 'L1', activeParagraphIndex: 0, aiParagraphs: {} }),
  clearRawText: () => set({ rawText: '', activeParagraphIndex: 0, aiParagraphs: {} }),

  aiParagraphs: {},
  setAiParagraphs: (level, paragraphs) =>
    set((s) => ({ aiParagraphs: { ...s.aiParagraphs, [level]: paragraphs } })),

  themeId: 'krem',
  setThemeId: (id) => set({ themeId: id }),
  typeLevelId: 'sedang',
  setTypeLevelId: (id) => set({ typeLevelId: id }),

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
}));
