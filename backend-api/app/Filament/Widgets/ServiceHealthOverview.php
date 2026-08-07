<?php

namespace App\Filament\Widgets;

use App\Services\AiTextService;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\Cache;
use Throwable;

/**
 * Kesehatan layanan, versi yang bisa dilihat sekilas.
 *
 * Isinya sama dengan GET /api/ai/health — endpoint itu untuk mesin, panel ini
 * untuk manusia. Ketiganya sengaja dipilih karena sama-sama gagal tanpa gejala
 * dari sisi pengguna: kunci yang belum diisi, simpanan yang tidak bisa ditulis,
 * dan penyedia yang belum terkonfigurasi hanya muncul sebagai "AI-nya error".
 */
class ServiceHealthOverview extends StatsOverviewWidget
{
    protected static ?int $sort = 0;

    protected function getStats(): array
    {
        return [
            $this->providerStat(),
            $this->cacheStat(),
            $this->cacheLifetimeStat(),
        ];
    }

    private function providerStat(): Stat
    {
        try {
            $ai = app(AiTextService::class);
        } catch (Throwable $e) {
            // AI_PROVIDER berisi nama yang tidak dikenal: seluruh fitur AI mati.
            return Stat::make('Penyedia LLM', 'Salah konfigurasi')
                ->description($e->getMessage())
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color('danger');
        }

        $configured = $ai->isConfigured();

        return Stat::make('Penyedia LLM', $ai->providerName())
            ->description($configured
                ? $ai->model()
                : 'Kunci API belum diisi — semua permintaan akan gagal')
            ->descriptionIcon($configured ? 'heroicon-m-check-circle' : 'heroicon-m-exclamation-triangle')
            ->color($configured ? 'success' : 'danger');
    }

    private function cacheStat(): Stat
    {
        $writable = $this->cacheWritable();

        return Stat::make('Simpanan hasil AI', $writable ? 'Berfungsi' : 'Tidak bisa ditulis')
            ->description($writable
                ? 'Store: '.config('cache.default')
                : 'Setiap permintaan akan memanggil model, kuota terbakar lebih cepat')
            ->descriptionIcon($writable ? 'heroicon-m-check-circle' : 'heroicon-m-exclamation-triangle')
            ->color($writable ? 'success' : 'danger');
    }

    private function cacheLifetimeStat(): Stat
    {
        $ttl = config('services.ai.cache_ttl');

        return Stat::make('Umur simpanan', $ttl === null ? 'Permanen' : "{$ttl} detik")
            ->description($ttl === null
                ? 'Permintaan identik tidak pernah memanggil model dua kali'
                : 'Setelah kedaluwarsa, permintaan yang sama menagih kuota lagi')
            ->descriptionIcon('heroicon-m-clock')
            ->color($ttl === null ? 'success' : 'warning');
    }

    private function cacheWritable(): bool
    {
        try {
            Cache::put('ai:health', true, 60);

            return Cache::get('ai:health') === true;
        } catch (Throwable) {
            return false;
        }
    }
}
