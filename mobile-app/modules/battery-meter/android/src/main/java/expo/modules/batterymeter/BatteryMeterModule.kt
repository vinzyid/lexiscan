package expo.modules.batterymeter

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import android.os.SystemClock
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Membaca sensor baterai Android apa adanya, untuk pengukuran energi di layar
 * uji (app/energy.tsx).
 *
 * Nilainya dikirim mentah, tanpa koreksi satuan atau tanda: sebagian HP
 * melaporkan arus dalam mikroampere, sebagian dalam miliampere, dan arah
 * tandanya juga beda antarmerek. Penafsirannya ada di JavaScript supaya bisa
 * diperiksa dan diubah tanpa build ulang.
 */
class BatteryMeterModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("BatteryMeter")

    Function("sample") {
      val manager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
      // Broadcast sticky: diminta tanpa receiver, jadi langsung berisi keadaan terakhir.
      val status = context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))

      mapOf(
        "elapsedMs" to SystemClock.elapsedRealtime().toDouble(),
        // Integer.MIN_VALUE kalau HP tidak menyediakan sensor arus.
        "currentNow" to manager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CURRENT_NOW).toDouble(),
        "chargeCounterMicroAmpHours" to manager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CHARGE_COUNTER).toDouble(),
        "voltageMilliVolts" to (status?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, -1) ?: -1).toDouble(),
        "temperatureDeciCelsius" to (status?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, -1) ?: -1).toDouble(),
        "levelPercent" to manager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY).toDouble(),
        "plugged" to ((status?.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0) ?: 0) != 0)
      )
    }
  }
}
