/**
 * Pemformat angka jejak karbon.
 *
 * Besarannya sangat kecil — satu permintaan AI sekitar 0,05 gram CO2e — jadi
 * satuannya harus ikut mengecil, kalau tidak seluruh layar penuh "0,00 g" yang
 * tidak berarti apa-apa.
 *
 * Pemisah desimalnya diurus sendiri, tidak lewat Intl: satu-satunya perbedaan
 * yang dibutuhkan aplikasi ini adalah koma untuk bahasa Indonesia, dan itu
 * tidak sepadan dengan risiko bergantung pada dukungan Intl di Hermes.
 */

/**
 * Kapasitas baterai ponsel umum dalam Wh (sekitar 4000 mAh pada 3,85 V).
 * Dipakai sebagai pembanding yang bisa dibayangkan orang; ketepatannya tidak
 * kritis karena memang disajikan sebagai "kira-kira".
 */
export const PHONE_BATTERY_WH = 15;

function decimals(value: number, digits: number, locale: string): string {
  const text = value.toFixed(digits);

  return locale.startsWith('id') ? text.replace('.', ',') : text;
}

/**
 * Gram CO2e → teks bersatuan. Di bawah 1 gram ditampilkan sebagai miligram
 * supaya angkanya punya digit yang berarti.
 */
export function formatMass(grams: number, locale: string): string {
  if (grams > 0 && grams < 1) {
    return `${decimals(grams * 1000, grams < 0.1 ? 1 : 0, locale)} mg`;
  }

  if (grams >= 1000) {
    return `${decimals(grams / 1000, 2, locale)} kg`;
  }

  return `${decimals(grams, grams >= 100 ? 0 : 2, locale)} g`;
}

/** Watt-hour → teks bersatuan, naik ke kWh setelah seribu. */
export function formatEnergy(wh: number, locale: string): string {
  if (wh >= 1000) {
    return `${decimals(wh / 1000, 2, locale)} kWh`;
  }

  return `${decimals(wh, wh >= 100 ? 0 : 2, locale)} Wh`;
}

/** Berapa persen baterai ponsel yang setara dengan energi sebanyak ini. */
export function batteryPercent(wh: number, locale: string): string {
  return decimals((wh / PHONE_BATTERY_WH) * 100, 1, locale);
}
