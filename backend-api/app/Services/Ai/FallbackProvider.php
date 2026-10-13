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
 * Yang memicu perpindahan hanya ProviderExhaustedException (kuota habis, rate
 * limit, saldo kurang, server hulu goyah) dan ProviderResponseException
 * (jawaban tidak bisa dibaca). Kunci salah, model tidak ada, atau teks yang
 * ditolak filter keamanan tetap dilempar apa adanya: cadangannya akan gagal
 * dengan cara yang sama, dan menyembunyikan sebabnya hanya memperlambat
 * perbaikan.
 */
class FallbackProvider implements AiProvider
{
    /**
     * Porsi anggaran waktu untuk provider utama; sisanya untuk cadangan.
     *
     * 0,65 dipilih dari perilaku nyata: provider utama yang sehat menjawab
     * dalam hitungan detik sampai belasan detik untuk satu halaman penuh,
     * sedangkan yang sedang bermasalah (kuota habis, server goyah) gagal cepat.
     * Porsi ini memberi cadangan ~35% — cukup untuk satu panggilan penuh, tapi
     * tidak membiarkan permintaan menggantung mendekati batas waktu klien.
     */
    private const PRIMARY_SHARE = 0.65;

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

    public function paragraphsFor(string $prompt, ?float $timeoutSeconds = null): LlmResult
    {
        /*
         * Seluruh rantai — utama lalu cadangan — harus muat dalam satu batas
         * waktu yang dipahami klien mobile (REQUEST_TIMEOUT_MS) DAN batas
         * eksekusi PHP server (max_execution_time, sering 30 detik). Kalau tiap
         * penyedia memakai timeout penuh sendiri, provider utama yang lambat
         * menghabiskan jatahnya, lalu cadangan menghabiskan jatah keduanya, dan
         * PHP membunuh permintaan sebelum server selesai — itulah yang membuat
         * permintaan "kebanyakan gagal" sebagai 500.
         *
         * Anggarannya datang dari pemanggil; kalau kosong, dipakai anggaran
         * efektif yang sudah memperhitungkan batas PHP. Lihat ExecutionBudget.
         */
        $budget = $timeoutSeconds ?? ExecutionBudget::seconds();

        /*
         * Provider utama diberi porsi lebih besar karena ia yang biasanya
         * menjawab, tetapi cadangan tetap disisakan cukup untuk benar-benar
         * dicoba — bukan sekadar formalitas yang langsung kehabisan waktu.
         */
        $primaryShare = $budget * self::PRIMARY_SHARE;

        try {
            return $this->primary->paragraphsFor($prompt, $primaryShare);
        } catch (ProviderExhaustedException | ProviderResponseException $e) {
            if (! $this->fallback->isConfigured()) {
                throw $e;
            }

            Log::warning('Penyedia AI utama gagal, berpindah ke cadangan', [
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
            return $this->fallback->paragraphsFor($prompt, $budget - $primaryShare);
        }
    }
}
