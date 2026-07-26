<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * Membaca JSON `{"paragraphs": [...]}` yang dikembalikan structured output.
 * Dipakai bersama kedua provider supaya aturan pembersihannya sama.
 */
final class ParagraphPayload
{
    /** @return array<int, string> */
    public static function extract(string $raw, string $providerLabel): array
    {
        $decoded = json_decode(self::unwrap($raw), true);

        if (! is_array($decoded)) {
            throw new RuntimeException("Respons {$providerLabel} bukan JSON yang bisa dibaca.");
        }

        $paragraphs = array_values(array_filter(
            array_map(
                static fn (mixed $paragraph): string => trim((string) $paragraph),
                array_filter(data_get($decoded, 'paragraphs', []), 'is_scalar'),
            ),
            static fn (string $paragraph): bool => $paragraph !== '',
        ));

        if ($paragraphs === []) {
            throw new RuntimeException("Hasil dari {$providerLabel} kosong setelah diproses.");
        }

        return $paragraphs;
    }

    /**
     * Model kecil sering tetap membungkus JSON dalam blok markdown atau
     * menambah kalimat pengantar, meski structured output sudah diminta.
     * Ambil objek JSON terluar supaya kasus itu tidak dianggap gagal.
     */
    private static function unwrap(string $raw): string
    {
        $text = trim($raw);

        if (preg_match('/```(?:json)?\s*(.+?)\s*```/s', $text, $fenced) === 1) {
            $text = trim($fenced[1]);
        }

        $start = strpos($text, '{');
        $end = strrpos($text, '}');

        return $start !== false && $end !== false && $end > $start
            ? substr($text, $start, $end - $start + 1)
            : $text;
    }
}
