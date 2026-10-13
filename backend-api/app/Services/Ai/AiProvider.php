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
}
