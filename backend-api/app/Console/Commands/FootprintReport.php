<?php

namespace App\Console\Commands;

use App\Models\AiUsageLog;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Ringkasan pemakaian AI untuk laporan green computing.
 *
 * Angkanya dipisah jadi dua kelompok dengan sengaja. TERUKUR berasal langsung
 * dari log permintaan: jumlah panggilan, cache hit, token yang dilaporkan
 * penyedia, dan latensi. TAKSIRAN adalah token itu dikali faktor energi di
 * config/footprint.php, karena listrik di datacenter penyedia tidak bisa diukur
 * dari luar. Keduanya tidak boleh tercampur saat dipresentasikan.
 */
#[Signature('footprint:report {--days=30 : Jumlah hari ke belakang}')]
#[Description('Ringkasan pemakaian AI: yang terukur dan yang ditaksir')]
class FootprintReport extends Command
{
    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $since = Carbon::now()->subDays($days);
        $logs = AiUsageLog::query()->where('created_at', '>=', $since);

        $total = (clone $logs)->count();

        if ($total === 0) {
            $this->warn("Belum ada permintaan AI dalam {$days} hari terakhir.");

            return self::SUCCESS;
        }

        $cached = (clone $logs)->where('cached', true)->count();
        $billed = $total - $cached;

        $this->info("Pemakaian AI {$days} hari terakhir (sejak {$since->toDateString()})");

        $this->newLine();
        $this->line('<options=bold>TERUKUR (dari log permintaan)</>');
        $this->table(['Fitur', 'Permintaan', 'Dari cache', 'Memanggil model', 'Token masuk', 'Token keluar'],
            (clone $logs)
                ->selectRaw('feature, count(*) as total, sum(case when cached then 1 else 0 end) as hits')
                ->selectRaw('sum(case when cached then 0 else input_tokens end) as input_tokens')
                ->selectRaw('sum(case when cached then 0 else output_tokens end) as output_tokens')
                ->groupBy('feature')
                ->orderBy('feature')
                ->get()
                ->map(fn ($row) => [
                    $row->feature,
                    $row->total,
                    $row->hits.' ('.$this->percent((int) $row->hits, (int) $row->total).'%)',
                    $row->total - $row->hits,
                    number_format((int) $row->input_tokens, 0, ',', '.'),
                    number_format((int) $row->output_tokens, 0, ',', '.'),
                ])
                ->push([
                    'SEMUA',
                    $total,
                    $cached.' ('.$this->percent($cached, $total).'%)',
                    $billed,
                    '',
                    '',
                ])
                ->all());

        // Hanya permintaan yang memanggil model: cache hit nyaris nol dan menyeret
        // rata-ratanya turun.
        $durations = (clone $logs)->where('cached', false)->whereNotNull('duration_ms')
            ->orderBy('duration_ms')->pluck('duration_ms')->map(fn ($ms) => (int) $ms)->all();

        if ($durations !== []) {
            $this->line(sprintf(
                'Latensi panggilan model (n=%d): median %s dtk, rata-rata %s dtk, p95 %s dtk',
                count($durations),
                $this->seconds($this->percentile($durations, 50)),
                $this->seconds(array_sum($durations) / count($durations)),
                $this->seconds($this->percentile($durations, 95)),
            ));
        }

        $this->newLine();
        $this->line('<options=bold>TAKSIRAN (token x faktor energi, metode '.config('footprint.method').')</>');
        $this->table(['Besaran', 'Nilai'], [
            ['Energi terpakai', $this->wh((float) (clone $logs)->sum('energy_wh'))],
            ['Energi dihindari cache', $this->wh((float) (clone $logs)->sum('avoided_energy_wh'))],
            ['Emisi terpakai', $this->grams((float) (clone $logs)->sum('co2e_g'))],
            ['Emisi dihindari cache', $this->grams((float) (clone $logs)->sum('avoided_co2e_g'))],
        ]);
        $this->line(sprintf(
            'Faktor: %s Wh/token masuk, %s Wh/token keluar, PUE %s, %s gCO2e/kWh (config/footprint.php).',
            config('footprint.wh_per_input_token'),
            config('footprint.wh_per_output_token'),
            config('footprint.pue'),
            config('footprint.grid_intensity_g_per_kwh'),
        ));

        return self::SUCCESS;
    }

    private function percent(int $part, int $whole): int
    {
        return $whole === 0 ? 0 : (int) round($part / $whole * 100);
    }

    /** @param  list<int>  $sorted */
    private function percentile(array $sorted, int $p): float
    {
        $index = (int) ceil($p / 100 * count($sorted)) - 1;

        return (float) $sorted[max(0, min($index, count($sorted) - 1))];
    }

    private function seconds(float $ms): string
    {
        return number_format($ms / 1000, 2, ',', '.');
    }

    private function wh(float $wh): string
    {
        return number_format($wh, 3, ',', '.').' Wh';
    }

    private function grams(float $grams): string
    {
        return number_format($grams, 3, ',', '.').' gCO2e';
    }
}
