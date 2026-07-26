<?php

namespace App\Services\Ai;

/**
 * Satu penyedia LLM. Prompt-nya dibuat di AiTextService — provider hanya
 * bertugas mengirimnya dan mengembalikan daftar paragraf.
 */
interface AiProvider
{
    /** Nama singkat untuk log, respons health, dan kunci cache. */
    public function name(): string;

    /** Kunci API sudah terpasang di .env atau belum. */
    public function isConfigured(): bool;

    /** Model yang sedang dipakai — ikut masuk kunci cache. */
    public function model(): string;

    /**
     * Kirim prompt, terima paragraf yang sudah bersih.
     *
     * @return array<int, string>
     *
     * @throws \RuntimeException Saat kunci belum diisi, kuota habis, atau respons tidak terpakai.
     */
    public function paragraphsFor(string $prompt): array;
}
