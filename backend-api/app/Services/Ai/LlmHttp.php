<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Klien HTTP bersama semua provider LLM: timeout dan kebijakan coba-ulang
 * cukup diatur di satu tempat.
 */
final class LlmHttp
{
    /** Percobaan pertama + 2 ulangan. */
    private const ATTEMPTS = 3;

    /** Jeda dasar; pengalinya naik per percobaan (1,2 s lalu 2,4 s). */
    private const BACKOFF_MS = 1200;

    /**
     * Aplikasi mobile berhenti menunggu di detik ke-70 (REQUEST_TIMEOUT_MS di
     * mobile-app/src/api/ai.ts), jadi ulangan setelah batas ini hanya membakar
     * kuota untuk klien yang sudah pergi.
     */
    private const BUDGET_SECONDS = 55;

    /**
     * Sisa anggaran minimum sebelum ulangan masih dianggap berguna. Ulangan
     * berikutnya butuh satu timeout penuh lagi; kalau sisa waktunya kurang dari
     * itu, mengulang hanya menahan permintaan sampai klien mobile menyerah —
     * lebih baik gagal cepat dan biarkan pemanggil berpindah penyedia.
     */
    private const MIN_RETRY_HEADROOM_SECONDS = 8.0;

    /**
     * Bangun klien HTTP untuk satu penyedia.
     *
     * `$timeoutSeconds` adalah anggaran untuk SATU percobaan HTTP ini. Diisi
     * pemanggil (lihat FallbackProvider) supaya seluruh rantai penyedia —
     * utama lalu cadangan — muat dalam satu batas waktu yang dipahami klien.
     * Null berarti pakai anggaran efektif dari ExecutionBudget.
     */
    public static function client(string $providerName, ?float $timeoutSeconds = null): PendingRequest
    {
        $startedAt = microtime(true);

        /*
         * Tanpa anggaran dari pemanggil, dipakai anggaran EFEKTIF — bukan
         * AI_TIMEOUT mentah. Penyedia tunggal (tanpa FallbackProvider) memanggil
         * dengan cara ini, dan AI_TIMEOUT 60 detik sementara batas PHP 30 detik
         * berarti permintaan yang lambat dibunuh PHP sebagai 500. Lihat
         * ExecutionBudget.
         */
        $budget = $timeoutSeconds ?? ExecutionBudget::seconds();

        /*
         * Batas ulangan tidak boleh melebihi anggaran yang diberikan pemanggil:
         * mengulang setelah anggaran habis sama saja dengan melampaui batas
         * waktu yang sudah dijanjikan ke klien.
         */
        $retryBudget = min(self::BUDGET_SECONDS, $budget);

        return Http::timeout((int) max(1, ceil($budget)))
            ->retry(
                self::ATTEMPTS,
                fn (int $attempt): int => self::BACKOFF_MS * $attempt,
                function (Throwable $e) use ($providerName, $startedAt, $retryBudget): bool {
                    if (! self::isTransient($e)) {
                        return false;
                    }

                    $spent = microtime(true) - $startedAt;
                    $remaining = $retryBudget - $spent;

                    if ($remaining <= self::MIN_RETRY_HEADROOM_SECONDS) {
                        Log::info('Ulangan LLM dihentikan, anggaran waktu habis', [
                            'provider' => $providerName,
                            'spent_seconds' => round($spent, 1),
                            'remaining_seconds' => round(max(0, $remaining), 1),
                        ]);

                        return false;
                    }

                    Log::info('Permintaan LLM diulang', [
                        'provider' => $providerName,
                        'status' => $e instanceof RequestException ? $e->response->status() : null,
                    ]);

                    return true;
                },
                // Provider yang menerjemahkan status akhir jadi pesan untuk
                // pengguna, jadi kembalikan Response apa adanya.
                throw: false,
            )
            ->acceptJson();
    }

    /**
     * Hanya kegagalan yang biasanya pulih dalam hitungan detik. ConnectionException
     * (timeout, DNS, TLS) tidak diulang karena sudah memakan seluruh AI_TIMEOUT.
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
