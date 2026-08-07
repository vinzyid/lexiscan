<?php

namespace Tests\Unit;

use App\Services\Ai\FootprintEstimator;
use App\Services\Ai\TokenUsage;
use Tests\TestCase;

class FootprintEstimatorTest extends TestCase
{
    public function test_a_medium_request_lands_on_the_published_reference_figures(): void
    {
        /*
         * Penjaga kalibrasi. Konstanta di config/footprint.php diturunkan mundur
         * supaya permintaan menengah (500 token masuk, 400 keluar) menghasilkan
         * angka yang sama dengan publikasi Google untuk satu prompt Gemini:
         * 0,24 Wh dan 0,03 gCO2e. Kalau salah satu konstanta diubah tanpa sadar,
         * test ini yang memberi tahu bahwa seluruh angka di aplikasi ikut geser.
         */
        $footprint = (new FootprintEstimator)->forUsage(new TokenUsage(500, 400));

        $this->assertEqualsWithDelta(0.24, $footprint->energyWh, 0.005);
        $this->assertEqualsWithDelta(0.03, $footprint->co2eGrams, 0.001);
    }

    public function test_output_tokens_cost_far_more_than_input_tokens(): void
    {
        /*
         * Bukan detail sepele: token keluar dibangkitkan satu per satu, masing-
         * masing menuntut satu lintasan penuh melewati bobot model, sedangkan
         * seluruh prompt diproses sekaligus. Kalau perbandingan ini terbalik,
         * penyederhanaan teks panjang akan tampak jauh lebih murah dari
         * seharusnya.
         */
        $estimator = new FootprintEstimator;

        $manyIn = $estimator->forUsage(new TokenUsage(1000, 0));
        $manyOut = $estimator->forUsage(new TokenUsage(0, 1000));

        $this->assertGreaterThan($manyIn->energyWh, $manyOut->energyWh);
    }

    public function test_a_cache_hit_records_the_saving_and_charges_nothing(): void
    {
        $footprint = (new FootprintEstimator)->forCacheHit(new TokenUsage(500, 400));

        $this->assertTrue($footprint->cached);
        $this->assertSame(0.0, $footprint->energyWh);
        $this->assertSame(0.0, $footprint->co2eGrams);
        $this->assertEqualsWithDelta(0.24, $footprint->avoidedEnergyWh, 0.005);
        $this->assertEqualsWithDelta(0.03, $footprint->avoidedCo2eGrams, 0.001);
    }

    public function test_a_provider_that_reports_no_tokens_yields_an_unknown_footprint(): void
    {
        /*
         * Nol token berarti "tidak dilaporkan", bukan "tidak memakai energi".
         * Menampilkannya sebagai 0 g akan menyesatkan, jadi ditandai supaya
         * aplikasi bisa menyembunyikannya.
         */
        $footprint = (new FootprintEstimator)->forUsage(TokenUsage::unknown());

        $this->assertFalse($footprint->isKnown());
        $this->assertSame(0.0, $footprint->co2eGrams);
    }

    public function test_the_grid_intensity_is_what_turns_energy_into_emissions(): void
    {
        // Menggandakan intensitas grid harus menggandakan emisi, sementara
        // energinya tidak berubah — inilah alasan angka wilayah datacenter
        // harus dipilih sadar, bukan asal.
        config(['footprint.grid_intensity_g_per_kwh' => 250.0]);

        $footprint = (new FootprintEstimator)->forUsage(new TokenUsage(500, 400));

        $this->assertEqualsWithDelta(0.24, $footprint->energyWh, 0.005);
        $this->assertEqualsWithDelta(0.06, $footprint->co2eGrams, 0.002);
    }
}
