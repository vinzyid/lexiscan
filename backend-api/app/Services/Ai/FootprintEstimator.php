<?php

namespace App\Services\Ai;

/**
 * Mengubah jumlah token menjadi taksiran energi dan emisi.
 *
 * Rumus dan asal setiap konstantanya didokumentasikan di config/footprint.php.
 * Kelas ini sengaja tidak menyimpan keadaan apa pun: satu permintaan masuk,
 * satu taksiran keluar, sehingga mudah diuji dan hasilnya bisa diulang.
 */
final class FootprintEstimator
{
    /** Taksiran untuk permintaan yang benar-benar memanggil model. */
    public function forUsage(TokenUsage $tokens): Footprint
    {
        if (! $tokens->isKnown()) {
            return Footprint::unknown();
        }

        [$energyWh, $co2eGrams] = $this->compute($tokens);

        return Footprint::spent($energyWh, $co2eGrams, $tokens);
    }

    /**
     * Taksiran untuk permintaan yang dilayani cache.
     *
     * Tokennya berasal dari panggilan asli yang dulu mengisi cache — itulah
     * beban yang tidak perlu dikeluarkan lagi sekarang.
     */
    public function forCacheHit(TokenUsage $tokens): Footprint
    {
        if (! $tokens->isKnown()) {
            // Entri cache lama tersimpan sebelum token ikut dicatat. Diperlakukan
            // sebagai tidak diketahui, bukan nol: penghematannya nyata, hanya
            // besarnya yang tidak bisa dipastikan.
            return Footprint::unknown();
        }

        [$energyWh, $co2eGrams] = $this->compute($tokens);

        return Footprint::avoided($energyWh, $co2eGrams, $tokens);
    }

    /** @return array{0: float, 1: float} Pasangan [Wh, gCO2e]. */
    private function compute(TokenUsage $tokens): array
    {
        $chipWh = ($tokens->input * (float) config('footprint.wh_per_input_token'))
            + ($tokens->output * (float) config('footprint.wh_per_output_token'));

        // PUE menambahkan listrik gedung datacenter di luar chip-nya sendiri.
        $energyWh = $chipWh * (float) config('footprint.pue');

        // Intensitas grid dinyatakan per kWh, energinya dalam Wh.
        $co2eGrams = ($energyWh / 1000) * (float) config('footprint.grid_intensity_g_per_kwh');

        return [$energyWh, $co2eGrams];
    }
}
