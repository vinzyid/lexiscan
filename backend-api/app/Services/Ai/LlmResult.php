<?php

namespace App\Services\Ai;

/**
 * Hasil satu panggilan penyedia: paragraf yang diminta, plus berapa token yang
 * terpakai untuk menghasilkannya.
 *
 * Sebelumnya provider hanya mengembalikan array paragraf dan jumlah token
 * dibuang begitu saja. Jejak karbon tidak bisa dihitung tanpa angka itu, jadi
 * keduanya dibawa bersama-sama.
 */
final class LlmResult
{
    /** @param array<int, string> $paragraphs */
    public function __construct(
        public readonly array $paragraphs,
        public readonly TokenUsage $tokens,
    ) {}
}
