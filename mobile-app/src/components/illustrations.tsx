/**
 * SVG hasil export dari file Figma "Final Desain", dipakai apa adanya —
 * memperbarui aset cukup dengan menimpa berkas di `assets/figma/`.
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
import IlluGradeSd1Svg from '../../assets/figma/illu-grade-sd1.svg';
import IlluGradeSd2Svg from '../../assets/figma/illu-grade-sd2.svg';
import IlluGradeSmpSvg from '../../assets/figma/illu-grade-smp.svg';
import IlluGradeSmaSvg from '../../assets/figma/illu-grade-sma.svg';
import IlluGradeUmumSvg from '../../assets/figma/illu-grade-umum.svg';
import IlluCanReadSvg from '../../assets/figma/illu-can-read.svg';
import IlluNeedVoiceSvg from '../../assets/figma/illu-need-voice.svg';

import type { SchoolLevelId } from '../theme/school-levels';

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

/* ── Kartu pilihan di pendaftaran ────────────────────────────────────────── */

/**
 * Ilustrasi 64x64 tiap kartu jenjang (Figma: IlluGradeSD1 … IlluGradeUmum).
 *
 * Dipetakan lewat tabel, bukan satu komponen per jenjang, karena pemanggilnya
 * memang mengulang `SCHOOL_LEVELS` — dan tabel inilah yang membuat menambah
 * jenjang baru gagal di TypeScript kalau gambarnya belum ada.
 */
const GRADE_SVGS: Record<SchoolLevelId, typeof IlluGradeSd1Svg> = {
  sd1: IlluGradeSd1Svg,
  sd2: IlluGradeSd2Svg,
  smp: IlluGradeSmpSvg,
  sma: IlluGradeSmaSvg,
  umum: IlluGradeUmumSvg,
};

export function IlluSchoolLevel({ id, size = 64 }: { id: SchoolLevelId; size?: number }) {
  const Svg = GRADE_SVGS[id];

  return <Svg width={size} height={size} />;
}

/** Buku bertanda centang — "Aku bisa membaca sendiri" (Figma: 60x60). */
export function IlluCanRead({ size = 60 }: { size?: number }) {
  return <IlluCanReadSvg width={size} height={size} />;
}

/** Pengeras suara — "Aku butuh bantuan suara" (Figma: 60x60). */
export function IlluNeedVoice({ size = 60 }: { size?: number }) {
  return <IlluNeedVoiceSvg width={size} height={size} />;
}
