<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Klien HTTP bersama untuk semua provider LLM.
 *
 * Timeout dan kebijakan coba-ulang tinggal di satu tempat supaya ketiga
 * provider tidak punya perilaku jaringan yang berbeda-beda.
 */
final class LlmHttp
{
    /** Percobaan pertama + 2 ulangan, selama anggaran waktu belum habis. */
    private const ATTEMPTS = 3;

    /** Jeda dasar; pengalinya naik per percobaan (1,2 s lalu 2,4 s). */
    private const BACKOFF_MS = 1200;

    /**
     * Aplikasi mobile membatalkan permintaan pada detik ke-70 (REQUEST_TIMEOUT_MS
     * di mobile-app/src/api/ai.ts). Mengulang setelah itu hanya membakar kuota
     * untuk klien yang sudah pergi, jadi ulangan berhenti di batas ini.
     */
    private const BUDGET_SECONDS = 55;

    public static function client(string $providerName): PendingRequest
    {
        $startedAt = microtime(true);

        return Http::timeout((int) config('services.ai.timeout'))
            ->retry(
                self::ATTEMPTS,
                fn (int $attempt): int => self::BACKOFF_MS * $attempt,
                function (Throwable $e) use ($providerName, $startedAt): bool {
                    if (! self::isTransient($e)) {
                        return false;
                    }

                    $spent = microtime(true) - $startedAt;

                    if ($spent >= self::BUDGET_SECONDS) {
                        Log::info('Ulangan LLM dihentikan, anggaran waktu habis', [
                            'provider' => $providerName,
                            'spent_seconds' => round($spent, 1),
                        ]);

                        return false;
                    }

                    Log::info('Permintaan LLM diulang', [
                        'provider' => $providerName,
                        'status' => $e instanceof RequestException ? $e->response->status() : null,
                    ]);

                    return true;
                },
                // Provider tetap yang memutuskan bagaimana status akhir
                // diterjemahkan menjadi pesan untuk pengguna, jadi setelah
                // ulangan habis kembalikan Response apa adanya.
                throw: false,
            )
            ->acceptJson();
    }

    /**
     * Hanya kegagalan yang biasanya pulih dalam hitungan detik.
     *
     * ConnectionException (timeout, DNS, TLS) sengaja tidak diulang: kasus
     * timeout memakan seluruh AI_TIMEOUT, jadi ulangannya hampir pasti melewati
     * batas sabar aplikasi mobile.
     */
    private static function isTransient(Throwable $e): bool
    {
        if (! $e instanceof RequestException) {
            return false;
        }

        $status = $e->response->status();

        // 429 = kuota bersama model gratis; 5xx = gateway LLM sedang goyah.
        return $status === 429 || $status >= 500;
    }
}
