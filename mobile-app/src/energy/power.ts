import type { BatterySample } from '../../modules/battery-meter';

/**
 * Hitungan daya dan energi dari bacaan sensor baterai.
 *
 * Dipisah dari layar uji supaya rumusnya bisa dibaca utuh di satu tempat,
 * karena angka yang keluar dari sini yang ditampilkan di presentasi dan harus
 * bisa dijelaskan asalnya:
 *
 *   daya (mW)          = |arus| (mA) x tegangan (V)
 *   daya bersih (mW)   = rata-rata daya saat bekerja - rata-rata daya saat diam
 *   energi (mJ)        = daya bersih (mW) x lama (detik)
 *   energi (mWh)       = energi (mJ) / 3600
 *
 * Daya diam ikut diukur di setiap putaran dan dikurangkan, sehingga yang
 * tersisa adalah tambahan beban dari fitur itu sendiri, bukan layar dan
 * sistem yang memang menyala terus.
 */

/** Nilai CURRENT_NOW saat HP tidak punya sensor arus. */
const NO_SENSOR = -2147483648;

export function hasCurrentSensor(sample: BatterySample): boolean {
  return sample.currentNow !== NO_SENSOR && sample.currentNow !== 0;
}

/**
 * Pembagi untuk mengubah CURRENT_NOW ke miliampere.
 *
 * Android menetapkan mikroampere, tapi sebagian merek melaporkan miliampere.
 * HP yang layarnya menyala menarik puluhan sampai ratusan mA, jadi median di
 * atas 10.000 hanya masuk akal sebagai µA, dan di bawahnya sebagai mA.
 */
export function currentDivisor(samples: BatterySample[]): 1 | 1000 {
  const magnitudes = samples.map((s) => Math.abs(s.currentNow)).sort((a, b) => a - b);
  const median = magnitudes[Math.floor(magnitudes.length / 2)] ?? 0;

  return median > 10_000 ? 1000 : 1;
}

/** Daya sesaat dalam miliwatt. Tanda arus diabaikan: arahnya beda antarmerek. */
export function powerMilliWatts(sample: BatterySample, divisor: 1 | 1000): number {
  return (Math.abs(sample.currentNow) / divisor) * (sample.voltageMilliVolts / 1000);
}

export type PhaseStats = {
  meanMw: number;
  sdMw: number;
  samples: number;
  seconds: number;
};

export function phaseStats(samples: BatterySample[], divisor: 1 | 1000): PhaseStats {
  const powers = samples.map((s) => powerMilliWatts(s, divisor));
  const n = powers.length;
  const mean = n ? powers.reduce((a, b) => a + b, 0) / n : 0;
  const variance = n > 1 ? powers.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;
  const seconds = n > 1 ? (samples[n - 1].elapsedMs - samples[0].elapsedMs) / 1000 : 0;

  return { meanMw: mean, sdMw: Math.sqrt(variance), samples: n, seconds };
}

/** Rata-rata dan simpangan baku antarputaran. */
export function meanSd(values: number[]): { mean: number; sd: number } {
  const n = values.length;
  const mean = n ? values.reduce((a, b) => a + b, 0) / n : 0;
  const variance = n > 1 ? values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1) : 0;

  return { mean, sd: Math.sqrt(variance) };
}

export const milliJoulesToMilliWattHours = (mj: number) => mj / 3600;
