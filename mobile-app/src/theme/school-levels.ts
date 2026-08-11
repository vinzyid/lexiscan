/**
 * Jenjang sekolah — pertanyaan langkah 2 pendaftaran.
 *
 * BEDANYA DENGAN `reading-levels.ts`, DAN KENAPA KEDUANYA ADA. Jenjang menjawab
 * "berapa umurmu kira-kira", kemampuan membaca menjawab "seberapa butuh bantuan
 * kamu sekarang". Keduanya sering tidak sejalan, dan justru ketidaksejalanan
 * itulah keadaan yang dilayani aplikasi ini: anak SMP yang masih mengeja tetap
 * mendapat huruf besar dan suku kata terpisah, bukan tampilan "anak SMP".
 *
 * Karena itu jenjang TIDAK menurunkan preset apa pun. Ia hanya disimpan ke
 * profil, dan gunanya di kemudian hari adalah memilih perbendaharaan kata saat
 * teks disederhanakan — bukan mengubah tampilan.
 *
 * Id-nya harus sama persis dengan App\Models\Reader::schoolLevels().
 */
export type SchoolLevelId = 'sd1' | 'sd2' | 'smp' | 'sma' | 'umum';

export type SchoolLevelPreset = {
  /** Nama & rentang usianya ada di `src/i18n` (`t.schoolLevels[id]`). */
  id: SchoolLevelId;

  /**
   * Kartu terakhir mengambil dua kolom sekaligus di grid, persis seperti di
   * Figma: "Umum" bukan salah satu jenjang sekolah, melainkan jalan keluar bagi
   * yang tidak satu pun cocok — dan itu harus terlihat dari bentuknya.
   */
  wide: boolean;
};

export const SCHOOL_LEVELS: SchoolLevelPreset[] = [
  { id: 'sd1', wide: false },
  { id: 'sd2', wide: false },
  { id: 'smp', wide: false },
  { id: 'sma', wide: false },
  { id: 'umum', wide: true },
];

export const isSchoolLevelId = (value: unknown): value is SchoolLevelId =>
  SCHOOL_LEVELS.some((level) => level.id === value);
