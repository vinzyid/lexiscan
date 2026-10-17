<?php

namespace Tests\Feature;

use App\Models\AiUsageLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FootprintReportTest extends TestCase
{
    use RefreshDatabase;

    private function log(string $feature, bool $cached, int $durationMs): void
    {
        AiUsageLog::create([
            'feature' => $feature,
            'language' => 'id',
            'provider' => 'test',
            'model' => 'test',
            'cached' => $cached,
            'input_tokens' => 500,
            'output_tokens' => 400,
            'energy_wh' => $cached ? 0 : 0.24,
            'avoided_energy_wh' => $cached ? 0.24 : 0,
            'co2e_g' => $cached ? 0 : 0.03,
            'avoided_co2e_g' => $cached ? 0.03 : 0,
            'duration_ms' => $durationMs,
        ]);
    }

    public function test_report_separates_measured_counts_from_estimates(): void
    {
        $this->log('simplify', false, 2000);
        $this->log('simplify', true, 5);
        $this->log('explain', false, 4000);
        $this->log('explain', true, 5);

        $this->artisan('footprint:report')
            ->expectsOutputToContain('TERUKUR')
            ->expectsOutputToContain('TAKSIRAN')
            // Cache hit (5 ms) tidak ikut dihitung: median dari 2 dan 4 detik.
            ->expectsOutputToContain('Latensi panggilan model (n=2)')
            ->expectsTable(['Besaran', 'Nilai'], [
                ['Energi terpakai', '0,480 Wh'],
                ['Energi dihindari cache', '0,480 Wh'],
                ['Emisi terpakai', '0,060 gCO2e'],
                ['Emisi dihindari cache', '0,060 gCO2e'],
            ])
            ->assertSuccessful();
    }

    public function test_report_says_so_when_there_is_no_usage(): void
    {
        $this->artisan('footprint:report')
            ->expectsOutputToContain('Belum ada permintaan AI')
            ->assertSuccessful();
    }
}
