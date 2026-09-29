<?php

namespace App\Services\Ai;

/**
 * Membaca JSON `{"paragraphs": [...]}` hasil structured output. Dipakai semua
 * provider supaya aturan pembersihannya sama.
 */
final class ParagraphPayload
{
    /** @return array<int, string> */
    public static function extract(string $raw, string $providerLabel): array
    {
        $text = self::unwrap($raw);
        $decoded = json_decode($text, true);

        /*
         * Sebagian model mengabaikan permintaan format JSON dan membalas teks
         * biasa — padahal isinya sudah benar. Dulu teks seperti itu dibuang dan
         * pengguna melihat galat "bukan JSON" untuk jawaban yang sebenarnya
         * bagus. Sekarang isinya tetap dipakai: baris kosong jadi pemisah
         * paragraf.
         */
        if (! is_array($decoded)) {
            return self::fromPlainText($text, $providerLabel);
        }

        $paragraphs = array_values(array_filter(
            array_map(
                static fn (mixed $paragraph): string => trim((string) $paragraph),
                array_filter(data_get($decoded, 'paragraphs', []), 'is_scalar'),
            ),
            static fn (string $paragraph): bool => $paragraph !== '',
        ));

        if ($paragraphs === []) {
            throw new ProviderResponseException("Hasil dari {$providerLabel} kosong setelah diproses.");
        }

        return $paragraphs;
    }

    /**
     * Teks bebas yang tidak berbentuk JSON. Baris kosong memisahkan paragraf;
     * kalau tidak ada baris kosong sama sekali, seluruh teks jadi satu paragraf.
     *
     * Penolakan model tetap ditolak: "maaf, saya tidak bisa membantu" bukan
     * jawaban, dan menerimanya berarti menyajikan kalimat kosong kepada pembaca
     * seolah-olah itu penjelasannya.
     *
     * @return array<int, string>
     */
    private static function fromPlainText(string $text, string $providerLabel): array
    {
        $trimmed = trim($text);

        if ($trimmed === '' || self::looksLikeRefusal($trimmed)) {
            throw new ProviderResponseException("Respons {$providerLabel} bukan JSON yang bisa dibaca.");
        }

        $paragraphs = array_values(array_filter(
            array_map('trim', preg_split('/\n\s*\n/', $trimmed) ?: []),
            static fn (string $paragraph): bool => $paragraph !== '',
        ));

        if ($paragraphs === []) {
            throw new ProviderResponseException("Respons {$providerLabel} tidak berisi teks yang bisa dipakai.");
        }

        return $paragraphs;
    }

    /**
     * Pola balasan yang isinya cuma pembukaan atau penolakan, bukan jawaban.
     * Yang ini lebih baik memicu penyedia berikutnya daripada diteruskan ke
     * pembaca.
     */
    private static function looksLikeRefusal(string $text): bool
    {
        if (mb_strlen($text) > 400) {
            return false;
        }

        return (bool) preg_match(
            '/^(maaf|sorry|mohon maaf|tidak bisa|sayangnya|aku tidak|saya tidak|i (?:can\'?t|cannot|am unable))/i',
            $text,
        );
    }

    /**
     * Model kecil sering tetap membungkus JSON dalam blok markdown atau kalimat
     * pengantar, jadi ambil objek JSON terluarnya saja.
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
