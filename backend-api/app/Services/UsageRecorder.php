<?php

namespace App\Services;

use App\Http\Middleware\IdentifyDevice;
use App\Models\AiUsageLog;
use App\Models\Device;
use App\Services\Ai\AiAnswer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Menulis satu baris riwayat untuk setiap permintaan AI yang selesai dilayani.
 *
 * Inilah yang membuat konsumsi dan kuota LLM bisa dipantau dari dashboard
 * admin. Angka jejak karbonnya disalin apa adanya dari taksiran yang sudah
 * dikirim ke aplikasi, bukan dihitung ulang, supaya yang dilihat admin persis
 * sama dengan yang dilihat pengguna.
 */
class UsageRecorder
{
    /**
     * Pencatatan tidak boleh menggagalkan permintaan yang jawabannya sudah siap.
     *
     * Pengguna sudah mendapat hasilnya dan kuotanya sudah terpakai; database
     * yang sedang bermasalah hanya membuat kita kehilangan satu baris laporan,
     * dan itu jauh lebih murah daripada menjatuhkan respons yang valid.
     */
    public function record(
        Request $request,
        string $feature,
        ?string $variant,
        string $language,
        AiAnswer $answer,
        string $provider,
        string $model,
        ?int $durationMs = null,
    ): void {
        $footprint = $answer->footprint;

        try {
            AiUsageLog::create([
                'device_id' => $this->deviceId($request),
                'feature' => $feature,
                'variant' => $variant,
                'language' => $language,
                'provider' => $provider,
                'model' => $model,
                'cached' => $footprint->cached,
                'input_tokens' => $footprint->tokens->input,
                'output_tokens' => $footprint->tokens->output,
                'energy_wh' => $footprint->energyWh,
                'co2e_g' => $footprint->co2eGrams,
                'avoided_energy_wh' => $footprint->avoidedEnergyWh,
                'avoided_co2e_g' => $footprint->avoidedCo2eGrams,
                'duration_ms' => $durationMs,
            ]);
        } catch (Throwable $e) {
            Log::warning('Pemakaian AI gagal dicatat.', [
                'feature' => $feature,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /** Null untuk aplikasi versi lama yang belum mengirim penanda perangkat. */
    private function deviceId(Request $request): ?string
    {
        $device = $request->attributes->get(IdentifyDevice::ATTRIBUTE);

        return $device instanceof Device ? $device->id : null;
    }
}
