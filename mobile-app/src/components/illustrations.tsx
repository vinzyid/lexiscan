/**
 * Ilustrasi asli dari file Figma "Final Desain", di-export sebagai SVG dan
 * dipakai apa adanya — bukan gambar ulang. Menyegarkan aset cukup dengan
 * menimpa berkas di `assets/figma/`; kode di sini tidak perlu berubah.
 *
 * Semua ilustrasi fitur digambar putih transparan karena selalu tampil di atas
 * ubin gradien 52x52 — lihat FEATURE_ACCENTS di theme/palettes.ts.
 */
import LexiSvg from '../../assets/figma/lexi.svg';
import IlluScanSvg from '../../assets/figma/illu-scan.svg';
import IlluTypoSvg from '../../assets/figma/illu-typo.svg';
import IlluSimplifySvg from '../../assets/figma/illu-simplify.svg';
import IlluFocusSvg from '../../assets/figma/illu-focus.svg';
import IlluExplainSvg from '../../assets/figma/illu-explain.svg';
import ArtRulerSvg from '../../assets/figma/art-ruler.svg';
import ArtIsolationSvg from '../../assets/figma/art-isolation.svg';
import ArtBicolorSvg from '../../assets/figma/art-bicolor.svg';

/** Maskot burung hantu "Lexi" (Figma: frame "Lexi", 120x120). */
export function LexiMascot({ size = 120 }: { size?: number }) {
  return <LexiSvg width={size} height={size} />;
}

/* ── Ilustrasi 37x37 di dalam ubin gradien tiap FeatureCard ───────────────── */

/** Dokumen + kaca pembesar — kartu "Smart OCR Scan". */
export function IlluScan({ size = 37 }: { size?: number }) {
  return <IlluScanSvg width={size} height={size} />;
}

/** Huruf "A" + garis dasar — kartu "Adaptive Typography". */
export function IlluTypo({ size = 37 }: { size?: number }) {
  return <IlluTypoSvg width={size} height={size} />;
}

/** Paragraf panjang menyusut jadi pendek — kartu "AI Simplify". */
export function IlluSimplify({ size = 37 }: { size?: number }) {
  return <IlluSimplifySvg width={size} height={size} />;
}

/** Satu baris disorot, sisanya diredupkan — kartu "Focus Mode". */
export function IlluFocus({ size = 37 }: { size?: number }) {
  return <IlluFocusSvg width={size} height={size} />;
}

/** Balon percakapan berisi bola lampu — kartu "AI Explain This". */
export function IlluExplain({ size = 37 }: { size?: number }) {
  return <IlluExplainSvg width={size} height={size} />;
}

/* ── Gambar di kartu "Inovasi Eksklusif" ─────────────────────────────────── */

/** Baris teks dengan satu baris disorot penggaris (Figma: 90x56). */
export function ArtReadingRuler({ width = 90 }: { width?: number }) {
  return <ArtRulerSvg width={width} height={width * (56 / 90)} />;
}

/** Satu kata diangkat keluar paragraf oleh ketukan jari (Figma: 70x70). */
export function ArtWordIsolation({ size = 70 }: { size?: number }) {
  return <ArtIsolationSvg width={size} height={size} />;
}

/** Deretan kata berwarna selang-seling (Figma: 322x48). */
export function ArtBicolorWords({ width = 322 }: { width?: number }) {
  return <ArtBicolorSvg width={width} height={width * (48 / 322.188)} />;
}
