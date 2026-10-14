<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\ConnectionException;
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
 * Yang memicu perpindahan: ProviderExhaustedException (kuota habis, rate
 * limit, saldo kurang, server hulu goyah), ProviderResponseException (jawaban
 * tidak bisa dibaca), dan ConnectionException (timeout, DNS, atau TLS — server
 * utama yang menggantung sama saja dengan tidak ada bagi pengguna). Kunci salah,
 * model tidak ada, atau teks yang ditolak filter keamanan tetap dilempar apa
 * adanya: cadangannya akan gagal dengan cara yang sama, dan menyembunyikan
 * sebabnya hanya memperlambat perbaikan.
 */
class FallbackProvider implements AiProvider
{

    /**
     * Waktu yang disisakan untuk penyedia cadangan, dalam detik.
     *
     * Dipakai sebagai cadangan tetap, bukan persentase: provider utama hampir
     * selalu yang menjawab, jadi ia yang paling butuh waktu. Angka ini hanya
     * cukup untuk satu panggilan cadangan yang berarti, atau untuk menyerah
     * dengan cepat bila seluruh anggaran memang sudah menipis.
     */
    private const FALLBACK_RESERVE_SECONDS = 6.0;

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
         * Provider utama mendapat anggaran PENUH dikurangi cadangan tetap yang
         * disisakan untuk penyedia cadangan — bukan persentase. Persentase
         * terlalu memangkas utama saat anggarannya kecil: dengan anggaran 30
         * detik, 65% hanya menyisakan 19,5 detik untuk provider yang biasanya
         * butuh lebih, sementara cadangan tidak akan terpakai sama sekali kalau
         * yang utama berhasil.
         *
         * Cadangan tetap disisakan, jadi ia tetap punya waktu nyata untuk
         * dicoba — bukan formalitas yang langsung kehabisan waktu.
         */
        $fallbackReserve = min(self::FALLBACK_RESERVE_SECONDS, $budget / 2);
        $primaryBudget = max(1.0, $budget - $fallbackReserve);

        try {
            return $this->primary->paragraphsFor($prompt, $primaryBudget);
        } catch (ProviderExhaustedException | ProviderResponseException | ConnectionException $e) {
            /*
             * ConnectionException ikut memicu perpindahan, dan itu penting untuk
             * keandalan: penyedia utama yang lambat atau tidak terjangkau
             * (timeout, DNS, TLS) sama saja dengan tidak ada bagi pengguna.
             * Dulu hanya kuota habis dan jawaban rusak yang memicu perpindahan,
             * sehingga server utama yang menggantung membuat permintaan gagal
             * walau cadangannya sehat.
             *
             * Syaratnya anggaran utama sudah dibatasi di atas, jadi cadangan
             * masih punya sisa waktu nyata untuk mencoba.
             */
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
            return $this->fallback->paragraphsFor($prompt, $budget - $primaryBudget);
        }
    }

    /**
     * Beberapa prompt sekaligus, memakai jalur batch penyedia yang bersangkutan.
     *
     * PENTING UNTUK KECEPATAN: kalau method ini hanya memanggil `paragraphsFor`
     * berulang (seperti bawaan trait), seluruh potongan teks panjang dikirim
     * BERURUTAN — dan jalur paralel milik penyedia utama (Griphub/APINEX) tidak
     * pernah terpakai, karena `paragraphsFor` memang satu permintaan. Meneruskan
     * ke `paragraphsForMany` penyedia membuat potongan tetap dikirim bersamaan.
     *
     * @param  array<int, string>  $prompts
     * @return array<int, LlmResult>
     */
    public function paragraphsForMany(array $prompts, ?float $timeoutSeconds = null): array
    {
        $budget = $timeoutSeconds ?? ExecutionBudget::seconds();
        $fallbackReserve = min(self::FALLBACK_RESERVE_SECONDS, $budget / 2);
        $primaryBudget = max(1.0, $budget - $fallbackReserve);

        try {
            return $this->primary->paragraphsForMany($prompts, $primaryBudget);
        } catch (ProviderExhaustedException | ProviderResponseException | ConnectionException $e) {
            if (! $this->fallback->isConfigured()) {
                throw $e;
            }

            Log::warning('Batch penyedia utama gagal, berpindah ke cadangan', [
                'primary' => $this->primary->name(),
                'fallback' => $this->fallback->name(),
                'reason' => $e->getMessage(),
            ]);

            return $this->fallback->paragraphsForMany($prompts, $budget - $primaryBudget);
        }
    }
}
