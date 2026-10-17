import { requireOptionalNativeModule } from 'expo';

/** Satu bacaan sensor baterai, mentah. Lihat BatteryMeterModule.kt. */
export type BatterySample = {
  elapsedMs: number;
  /** Arus sesaat. Satuan (µA atau mA) dan tandanya tergantung merek HP. */
  currentNow: number;
  chargeCounterMicroAmpHours: number;
  voltageMilliVolts: number;
  temperatureDeciCelsius: number;
  levelPercent: number;
  plugged: boolean;
};

type BatteryMeterNative = { sample(): BatterySample };

/**
 * `null` di APK yang dibangun sebelum modul ini ada. Opsional, bukan wajib:
 * pembaruan OTA yang membawa layar uji tidak boleh membuat APK lama crash.
 */
export const BatteryMeter = requireOptionalNativeModule<BatteryMeterNative>('BatteryMeter');
