import type { LanguageId } from '../store/useStore';

/**
 * Ejaan pengganti untuk suku kata yang salah dilafalkan mesin TTS.
 *
 * KENAPA PERLU. Saat mengeja, tiap suku kata diucapkan sendirian (lihat
 * `speakSequence`). Tanpa kata di sekitarnya, mesin suara Google menebak
 * bahasanya dari potongan itu saja, dan potongan yang kebetulan sama dengan
 * kata Inggris dibaca sebagai bahasa Inggris: "me" dari "me-nyim-pan" terdengar
 * "mi". Di dalam kalimat utuh masalah ini tidak muncul.
 *
 * Yang diganti HANYA teks yang dibunyikan. Di layar suku katanya tetap ditulis
 * apa adanya, karena yang sedang dipelajari anak adalah tulisan aslinya.
 *
 * Isinya dipilih dengan telinga lewat layar Uji Lafal (`app/lafal.tsx`), bukan
 * ditebak: lafal tiap mesin TTS berbeda, dan ejaan pengganti yang salah lebih
 * buruk daripada tidak diganti sama sekali.
 */
const RESPELL: Record<LanguageId, Record<string, string>> = {
  id: {},
  en: {},
};

/** Teks yang dibunyikan untuk satu suku kata saat mengeja. */
export function syllableForSpeech(piece: string, language: LanguageId): string {
  return RESPELL[language][piece.toLowerCase()] ?? piece;
}
