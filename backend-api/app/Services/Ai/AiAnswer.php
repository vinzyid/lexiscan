<?php

namespace App\Services\Ai;

/**
 * Jawaban lengkap satu permintaan fitur AI: paragraf untuk dibaca pengguna,
 * plus taksiran dampak lingkungannya.
 *
 * Bedanya dengan LlmResult: LlmResult adalah keluaran mentah satu panggilan
 * penyedia, sedangkan AiAnswer adalah hasil akhir layanan — bisa jadi tidak
 * ada penyedia yang dipanggil sama sekali karena jawabannya dari cache.
 */
final class AiAnswer
{
    /** @param array<int, string> $paragraphs */
    public function __construct(
        public readonly array $paragraphs,
        public readonly Footprint $footprint,
    ) {}
}
