<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

/**
 * Penyedia utama dengan satu cadangan yang menggantikannya begitu jatahnya
 * habis.
 *
 * Alasannya praktis: kuota harian Gemini gratis bisa habis di tengah demo, dan
 * "coba lagi besok" bukan jawaban yang bisa diterima saat juri sedang mencoba
 * aplikasinya. Perpindahannya tidak terlihat oleh aplikasi mobile — bentuk
 * responsnya sama persis, hanya kalimatnya yang mungkin sedikit berbeda gaya.
 *
 * Yang memicu perpindahan hanya ProviderExhaustedException. Kunci salah, model
 * tidak ada, atau teks yang ditolak filter keamanan tetap dilempar apa adanya:
 * cadangannya akan gagal dengan cara yang sama, dan menyembunyikan sebabnya
 * hanya memperlambat perbaikan.
 */
class FallbackProvider implements AiProvider
{
    public function __construct(
        private readonly AiProvider $primary,
        private readonly AiProvider $fallback,
    ) {}

    /**
     * Identitas penyedia utama, bukan gabungan keduanya.
     *
     * Nama dan model ikut menyusun kunci cache. Kalau nilainya berubah setiap
     * cadangan dipasang atau dilepas, seluruh simpanan jawaban yang sudah ada
     * langsung menjadi tak terpakai — padahal isinya masih benar. Jawaban yang
     * kebetulan dibuat oleh cadangan pun disimpan di bawah kunci ini, dan itu
     * disengaja: yang disimpan adalah jawabannya, bukan catatan siapa yang
     * membuatnya.
     */
    public function name(): string
    {
        return $this->primary->name();
    }

    public function model(): string
    {
        return $this->primary->model();
    }

    /** Nama penyedia cadangan; dipakai endpoint health supaya bisa ditengok. */
    public function fallbackName(): string
    {
        return $this->fallback->name();
    }

    public function isConfigured(): bool
    {
        return $this->primary->isConfigured();
    }

    public function paragraphsFor(string $prompt): LlmResult
    {
        try {
            return $this->primary->paragraphsFor($prompt);
        } catch (ProviderExhaustedException $e) {
            if (! $this->fallback->isConfigured()) {
                throw $e;
            }

            Log::warning('Penyedia AI utama kehabisan jatah, berpindah ke cadangan', [
                'primary' => $this->primary->name(),
                'fallback' => $this->fallback->name(),
                'reason' => $e->getMessage(),
            ]);

            /*
             * Kegagalan cadangan dilempar apa adanya, bukan digabung dengan
             * pesan yang utama. Yang dilihat pengguna sebaiknya keadaan
             * terakhir yang benar-benar dicoba; jejak lengkapnya sudah ada di
             * log baris atas.
             */
            return $this->fallback->paragraphsFor($prompt);
        }
    }
}
