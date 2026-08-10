/**
 * Hanya identitas: id level, id gaya penjelasan, emoji. Semua teks yang dibaca
 * pengguna ada di `src/i18n` supaya tidak hidup di dua tempat.
 */
export type SimplifyLevelId = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';

/** Urutan tombol pemilih level di layar Baca; L1 adalah teks asli, tanpa AI. */
export const SIMPLIFY_LEVEL_IDS: SimplifyLevelId[] = ['L1', 'L2', 'L3', 'L4', 'L5'];

/** Tiga gaya penjelasan di layar "Tanya Lexi". */
export type ExplainStyleId = 'sederhana' | 'analogi' | 'nyata';

export const EXPLAIN_STYLE_IDS: ExplainStyleId[] = ['sederhana', 'analogi', 'nyata'];

/** Emoji cadangan kalau ikon Lucide untuk sebuah gaya belum dipetakan. */
export const EXPLAIN_STYLE_EMOJI: Record<ExplainStyleId, string> = {
  sederhana: '💬',
  analogi: '🎯',
  nyata: '🌍',
};
