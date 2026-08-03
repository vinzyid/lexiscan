import { useOCRStore } from '../store/useStore';
import { en } from './en';
import { id, type Translation } from './id';

export type LanguageId = 'id' | 'en';

const DICTIONARIES: Record<LanguageId, Translation> = { id, en };

export const LANGUAGES: { id: LanguageId; name: string; english: string }[] = [
  { id: 'id', name: id.languageName, english: 'Indonesian' },
  { id: 'en', name: en.languageName, english: 'English' },
];

/** Kamus di luar komponen — untuk pemanggil non-React seperti `src/api/ai.ts`. */
export const dictionaryFor = (language: LanguageId): Translation => DICTIONARIES[language];

/** Teks untuk bahasa yang sedang dipilih. */
export function useT(): Translation {
  return DICTIONARIES[useOCRStore((s) => s.language)];
}

/** Kode locale aktif, mis. untuk `Date.toLocaleDateString`. */
export function useLocale(): string {
  return useT().locale;
}

export type { Translation };
