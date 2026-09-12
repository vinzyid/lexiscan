<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Griphub Router — banyak model dari satu kunci, OpenAI-compatible.
 *
 * Sama seperti OpenRouter: satu endpoint `/v1/chat/completions`, autentikasi
 * lewat Bearer token, dan balasan bergaya OpenAI. Yang berbeda hanya alamat
 * dasarnya, sehingga lapisan HTTP-nya bisa dibuat tipis.
 *
 * MODEL DIPILIH LEWAT .env, bukan di sini. Daftar model Griphub bisa berubah
 * tanpa pemberitahuan, jadi menuliskan nama model di dalam kode berarti setiap
 * pergantian model menuntut deploy ulang.
 *
 * SYARAT MODEL: harus mendukung structured outputs / JSON mode. Kalau tidak,
 * jawabannya berupa teks bebas dan jaminan format paragraf hilang — aplikasi
 * mobile mengharapkan `{"paragraphs": [...]}`. Model yang mendukung biasanya
 * mencantumkan "json" atau "structured" di deskripsinya.
 */
class GriphubProvider implements AiProvider
{
    public function name(): string
    {
        return 'griphub';
    }

    public function isConfigured(): bool
    {
        return filled(config('services.griphub.key'));
    }

    public function model(): string
    {
        return (string) config('services.griphub.model');
    }

    /**
     * Alamat lengkap endpoint chat.
     *
     * `base_url` di .env cukup diisi sampai `/v1` — akhiran `/chat/completions`
     * ditambahkan di sini supaya tidak salah tulis. Kalau base_url-nya sudah
     * memuat akhiran itu (salah tulis), tidak ditambahkan dua kali.
     */
    private function endpoint(): string
    {
        $base = rtrim((string) config('services.griphub.base_url'), '/');

        return str_ends_with($base, '/chat/completions')
            ? $base
            : $base . '/chat/completions';
    }

    public function paragraphsFor(string $prompt): LlmResult
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('GRIPHUB_API_KEY belum diisi di file .env backend.');
        }

        $response = LlmHttp::client($this->name())
            ->withToken((string) config('services.griphub.key'))
            ->post($this->endpoint(), [
                'model' => $this->model(),
                'temperature' => 0.3,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Kamu membantu pembaca disleksia. Jawab hanya dengan JSON dalam format {"paragraphs": ["teks paragraf 1", "teks paragraf 2"]}, tanpa penjelasan tambahan.',
                    ],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'response_format' => [
                    'type' => 'json_object',
                ],
            ]);

        if ($response->failed()) {
            // Pesan asli dicatat supaya kuota habis vs kunci salah bisa dibedakan.
            Log::warning('Permintaan Griphub gagal', [
                'status' => $response->status(),
                'body' => $response->json('error.message') ?? $response->body(),
            ]);

            throw $this->failure($response->status(), $response->json('error.message'));
        }

        /*
         * Router bergaya ini kadang membalas 200 tapi isinya galat dari model
         * hulu — misalnya model sedang tidak tersedia. Tanpa pemeriksaan ini,
         * galatnya muncul sebagai "respons bukan JSON yang bisa dibaca" dan
         * sebab sebenarnya tertutup.
         */
        if (filled($upstream = $response->json('error.message'))) {
            Log::warning('Griphub membalas 200 dengan error', ['body' => $upstream]);

            throw new RuntimeException("Model menolak permintaan: {$upstream}");
        }

        $raw = $response->json('choices.0.message.content');

        if (blank($raw)) {
            // Model yang hanya mengembalikan penalaran tidak meninggalkan `content`
            // sama sekali; pengguna perlu tahu itu bukan sekadar "coba lagi".
            throw new RuntimeException(
                'Griphub tidak mengembalikan teks. Periksa apakah model "'
                . $this->model() . '" mendukung mode JSON.'
            );
        }

        return new LlmResult(
            ParagraphPayload::extract((string) $raw, 'Griphub'),
            TokenUsage::fromOpenAi($response->json('usage')),
        );
    }

    /**
     * Hanya kehabisan jatah yang layak dipindahkan ke penyedia cadangan.
     * 402 ikut karena saldo habis berarti permintaan berikutnya pun ditolak;
     * kunci salah dan model tidak ada tetap dilempar apa adanya supaya salah
     * konfigurasi ketahuan, bukan tertutupi.
     */
    private function failure(int $status, ?string $detail): RuntimeException
    {
        $message = $this->humanError($status, $detail);

        return in_array($status, [402, 429], true) || $status >= 500
            ? new ProviderExhaustedException($message)
            : new RuntimeException($message);
    }

    private function humanError(int $status, ?string $detail): string
    {
        return match (true) {
            $status === 401 => 'GRIPHUB_API_KEY tidak valid. Periksa kembali kunci dari griphubrouter.web.id.',
            $status === 402 => 'Saldo Griphub tidak cukup untuk model ini. Periksa saldo akun Anda.',
            $status === 404 => 'Model "' . $this->model() . '" tidak ditemukan di Griphub. Periksa ejaan namanya.',
            $status === 429 => 'Jatah Griphub sedang habis. Tunggu sebentar lalu coba lagi.',
            $status >= 500 => 'Server Griphub sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke Griphub gagal.',
        };
    }
}
