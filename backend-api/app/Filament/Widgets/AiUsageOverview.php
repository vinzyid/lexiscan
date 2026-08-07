<?php

namespace App\Filament\Widgets;

use App\Models\AiUsageLog;
use App\Models\Device;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

/**
 * Ringkasan konsumsi LLM 30 hari terakhir.
 *
 * Komponen inilah yang berbiaya variabel, jadi inilah yang perlu dilihat
 * pertama kali saat dashboard dibuka. Angka "dilayani simpanan" sengaja
 * disandingkan dengan totalnya: itu bagian yang tidak menagih kuota sama
 * sekali, dan naik-turunnya menandakan apakah cache masih bekerja.
 */
class AiUsageOverview extends StatsOverviewWidget
{
    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $since = Carbon::now()->subDays(30);

        $logs = AiUsageLog::query()->where('created_at', '>=', $since);

        $total = (clone $logs)->count();
        $cached = (clone $logs)->where('cached', true)->count();
        $billed = $total - $cached;

        $tokens = (clone $logs)->sum('input_tokens') + (clone $logs)->sum('output_tokens');
        $spent = (float) (clone $logs)->sum('co2e_g');
        $avoided = (float) (clone $logs)->sum('avoided_co2e_g');

        // Latensi rata-rata hanya bermakna untuk permintaan yang benar-benar
        // memanggil model; cache hit selalu nyaris nol dan akan menyeret turun.
        $latency = (clone $logs)->where('cached', false)->avg('duration_ms');

        return [
            Stat::make('Permintaan AI (30 hari)', number_format($total, 0, ',', '.'))
                ->description($total === 0
                    ? 'Belum ada permintaan tercatat'
                    : "{$this->percent($cached, $total)}% dilayani simpanan, tanpa memanggil model")
                ->descriptionIcon('heroicon-m-bolt-slash')
                ->color($total === 0 ? 'gray' : 'primary'),

            Stat::make('Memanggil model', number_format($billed, 0, ',', '.'))
                ->description('Inilah yang benar-benar menagih kuota')
                ->descriptionIcon('heroicon-m-cpu-chip')
                ->color('warning'),

            Stat::make('Token terpakai', $this->compact($tokens))
                ->description('Masuk + keluar, termasuk token penalaran')
                ->descriptionIcon('heroicon-m-hashtag'),

            Stat::make('Emisi terpakai', $this->mass($spent))
                ->description('Dihindari lewat simpanan: '.$this->mass($avoided))
                ->descriptionIcon('heroicon-m-leaf')
                ->color('success'),

            Stat::make('Perangkat aktif', number_format(
                Device::where('last_seen_at', '>=', $since)->count(), 0, ',', '.'
            ))
                ->description(($blocked = Device::whereNotNull('blocked_at')->count()) > 0
                    ? "{$blocked} sedang diblokir"
                    : 'Tidak ada yang diblokir')
                ->descriptionIcon('heroicon-m-device-phone-mobile')
                ->color($blocked > 0 ? 'danger' : 'gray'),

            Stat::make('Latensi rata-rata', $latency === null
                ? '—'
                : number_format((float) $latency / 1000, 2, ',', '.').' dtk')
                ->description('Hanya permintaan yang memanggil model')
                ->descriptionIcon('heroicon-m-clock'),
        ];
    }

    private function percent(int $part, int $whole): int
    {
        return $whole === 0 ? 0 : (int) round($part / $whole * 100);
    }

    /** Gram → satuan yang punya digit berarti; sama seperti di aplikasi mobile. */
    private function mass(float $grams): string
    {
        if ($grams > 0 && $grams < 1) {
            return number_format($grams * 1000, 1, ',', '.').' mg';
        }

        if ($grams >= 1000) {
            return number_format($grams / 1000, 2, ',', '.').' kg';
        }

        return number_format($grams, 2, ',', '.').' g';
    }

    private function compact(int $value): string
    {
        if ($value >= 1_000_000) {
            return number_format($value / 1_000_000, 1, ',', '.').' jt';
        }

        if ($value >= 1_000) {
            return number_format($value / 1_000, 1, ',', '.').' rb';
        }

        return (string) $value;
    }
}
