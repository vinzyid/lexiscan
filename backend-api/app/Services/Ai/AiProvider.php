<?php

namespace App\Services\Ai;

/**
 * Satu penyedia LLM. Prompt dibuat di AiTextService; provider hanya mengirimnya
 * dan mengembalikan daftar paragraf.
 */
interface AiProvider
{
    /** Nama singkat untuk log, respons health, dan kunci cache. */
    public function name(): string;

    public function isConfigured(): bool;

    public function model(): string;

    /**
     * Paragraf jawaban beserta jumlah token yang terpakai membuatnya.
     *
     * Tokennya dibawa serta karena jejak karbon dihitung darinya; penyedia yang
     * tidak melaporkannya mengembalikan TokenUsage::unknown().
     *
     * `$timeoutSeconds` adalah anggaran untuk SATU percobaan penyedia ini,
     * dihitung oleh pemanggil (FallbackProvider/ProviderSelector) dari sisa
     * waktu total yang sudah dijanjikan ke klien. Provider boleh mengabaikannya
     * dan memakai AI_TIMEOUT; parameter ini opsional supaya implementasi lama
     * tetap sah tanpa perubahan.
     *
     * @throws \RuntimeException Saat kunci belum diisi, kuota habis, atau respons tidak terpakai.
     */
    public function paragraphsFor(string $prompt, ?float $timeoutSeconds = null): LlmResult;

    /**
     * Beberapa prompt sekaligus, dikembalikan dalam urutan yang sama.
     *
     * ADA UNTUK MENJAWAB MASALAH KECEPATAN, BUKAN KERAPIAN. Menyederhanakan
     * dokumen panjang memecah teks jadi beberapa potongan, dan dulu potongan
     * itu dikirim satu per satu — total waktunya jumlah dari semuanya (tiga
     * potongan ≈ tiga kali sepuluh detik). Provider yang bisa mengirim
     * permintaan HTTP secara bersamaan menimpa method ini dan mengembalikan
     * seluruh jawaban dalam waktu satu potongan.
     *
     * Implementasi bawaan sengaja BERURUTAN, bukan abstrak: provider yang belum
     * siap paralel tetap benar, hanya tidak lebih cepat. Karena itu menambah
     * paralel di satu provider tidak memaksa provider lain diubah.
     *
     * Kontraknya: hasil[$i] harus jawaban untuk $prompts[$i]. Kalau salah satu
     * prompt gagal, seluruh panggilan boleh gagal — pemanggil memperlakukannya
     * sebagai satu kesatuan, sama seperti versi berurutannya.
     *
     * @param  array<int, string>  $prompts
     * @return array<int, LlmResult>
     *
     * @throws \RuntimeException
     */
    public function paragraphsForMany(array $prompts, ?float $timeoutSeconds = null): array;
}
