import { create } from 'zustand';
import type { ThemeId, TypeLevelId } from '../theme/palettes';
import type { SimplifyLevelId } from '../data/sample-document';

interface OCRState {
  /** Teks mentah hasil OCR; kosong berarti pengguna masih memakai dokumen contoh. */
  rawText: string;
  setRawText: (text: string) => void;
  clearRawText: () => void;

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

  /** Gamifikasi di banner dashboard */
  level: number;
  xp: number;
  streakDays: number;
  addXp: (amount: number) => void;
}

const XP_PER_LEVEL = 250;

export const useOCRStore = create<OCRState>((set) => ({
  rawText: '',
  setRawText: (text) => set({ rawText: text, simplifyLevel: 'L1', activeParagraphIndex: 0 }),
  clearRawText: () => set({ rawText: '', activeParagraphIndex: 0 }),

  themeId: 'krem',
  setThemeId: (id) => set({ themeId: id }),
  typeLevelId: 'sedang',
  setTypeLevelId: (id) => set({ typeLevelId: id }),

  simplifyLevel: 'L1',
  setSimplifyLevel: (id) => set({ simplifyLevel: id, activeParagraphIndex: 0 }),
  focusMode: false,
  toggleFocusMode: () =>
    set((s) => ({ focusMode: !s.focusMode, activeParagraphIndex: s.focusMode ? s.activeParagraphIndex : 0 })),
  rulerMode: false,
  toggleRulerMode: () => set((s) => ({ rulerMode: !s.rulerMode })),
  bicolorMode: false,
  toggleBicolorMode: () => set((s) => ({ bicolorMode: !s.bicolorMode })),
  activeParagraphIndex: 0,
  setActiveParagraphIndex: (index) => set({ activeParagraphIndex: Math.max(0, index) }),

  level: 4,
  xp: 100,
  streakDays: 5,
  addXp: (amount) =>
    set((s) => {
      const total = s.xp + amount;
      return total >= XP_PER_LEVEL
        ? { level: s.level + Math.floor(total / XP_PER_LEVEL), xp: total % XP_PER_LEVEL }
        : { xp: total };
    }),
}));

export { XP_PER_LEVEL };
