import type { ReadingLevelId } from '../theme/reading-levels';
import type { SchoolLevelId } from '../theme/school-levels';
import type { LanguageId } from '../store/useStore';
import { postJson } from './ai';

/** Bentuk profil yang dikirim backend; lihat App\Models\Reader::toProfile(). */
export type ReaderProfile = {
  id: number;
  name: string;
  username: string;
  reading_level: ReadingLevelId;

  /**
   * Sejajar dengan reading_level, bukan di dalam `preferences` — jenjang bukan
   * pilihan tampilan yang boleh dipasang ulang oleh preset. `null` untuk akun
   * yang mendaftar sebelum pertanyaan ini ada.
   */
  school_level: SchoolLevelId | null;

  /**
   * Preferensi yang pernah diubah sendiri oleh penggunanya.
   *
   * `null` di sebuah kolom berarti ia belum pernah menyimpang dari preset
   * kemampuan membacanya — bukan berarti mati. Membedakan keduanya penting:
   * yang null boleh dipasang ulang oleh preset, yang `false` tidak boleh.
   */
  preferences: {
    language: LanguageId | null;
    theme: string | null;
    type_level: string | null;
    tts_enabled: boolean | null;
    tts_auto_play: boolean | null;
    syllable_spacing: boolean | null;
    bicolor_words: boolean | null;
  };
};

export type AuthResult = { token: string; reader: ReaderProfile };

export type RegisterInput = {
  name: string;
  username: string;
  password: string;
  readingLevel: ReadingLevelId;
  /** Boleh dilewati — backend menerimanya null. */
  schoolLevel: SchoolLevelId | null;
};

/** POST /api/auth/register */
export async function register(input: RegisterInput): Promise<AuthResult> {
  return postJson('/api/auth/register', {
    name: input.name.trim(),
    username: input.username.trim(),
    password: input.password,
    reading_level: input.readingLevel,
    school_level: input.schoolLevel,
  });
}

/** POST /api/auth/login */
export async function login(username: string, password: string): Promise<AuthResult> {
  return postJson('/api/auth/login', { username: username.trim(), password });
}

/** POST /api/auth/logout — mencabut token yang sedang dipakai saja. */
export async function logout(): Promise<void> {
  await postJson('/api/auth/logout', {});
}

/**
 * PATCH /api/auth/preferences
 *
 * Gunanya supaya penyesuaian ikut pindah kalau penggunanya berganti HP. Yang
 * dikirim hanya kolom yang benar-benar berubah, jadi kolom lain tetap null di
 * server dan masih boleh dipasang ulang oleh preset nanti.
 */
export async function savePreferences(
  preferences: Partial<{
    reading_level: ReadingLevelId;
    school_level: SchoolLevelId | null;
    /*
     * Boleh null — dan itu bukan sekadar "kosongkan". null mengembalikan kolom
     * ke keadaan "belum pernah diubah sendiri", sehingga preset kemampuan
     * membaca boleh memasangnya lagi. Dikirim saat pengguna berganti tingkat.
     */
    language: LanguageId | null;
    theme: string | null;
    type_level: string | null;
    tts_enabled: boolean | null;
    tts_auto_play: boolean | null;
    syllable_spacing: boolean | null;
    bicolor_words: boolean | null;
  }>,
): Promise<{ reader: ReaderProfile }> {
  return postJson('/api/auth/preferences', preferences, { method: 'PATCH' });
}
