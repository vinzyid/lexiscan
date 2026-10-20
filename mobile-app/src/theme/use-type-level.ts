import { useMemo } from 'react';

import { useOCRStore } from '../store/useStore';
import { getTypeLevel, type TypeLevel } from './palettes';

/**
 * Ukuran huruf yang bisa dipilih pendamping, dalam px.
 *
 * Ketiga ukuran preset Mode Disleksia (16, 18, 21) ada di dalamnya, jadi
 * tombol perkecil/perbesar selalu bisa kembali tepat ke ukuran preset. Batas
 * atasnya 32: lebih dari itu satu baris di layar HP hanya muat dua atau tiga
 * kata, dan kalimatnya justru makin sulit diikuti.
 */
export const FONT_SIZES = [14, 16, 18, 21, 24, 28, 32] as const;

/**
 * Tipografi teks bacaan yang benar-benar berlaku: preset Mode Disleksia,
 * dengan ukuran hurufnya ditimpa pilihan pendamping kalau ada.
 *
 * Tinggi baris ikut membesar karena dihitung dari `lineHeightRatio`, jadi
 * huruf yang diperbesar tidak pernah berdesakan dengan baris di atasnya.
 */
export function useTypeLevel(): TypeLevel {
  const typeLevelId = useOCRStore((s) => s.typeLevelId);
  const fontSize = useOCRStore((s) => s.fontSize);

  return useMemo(() => {
    const level = getTypeLevel(typeLevelId);

    return fontSize === null ? level : { ...level, fontSize };
  }, [typeLevelId, fontSize]);
}
