<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * OpenRouter — gerbang ke banyak model lewat satu kunci, OpenAI-compatible.
 *
 * Model gratis (berakhiran ":free") jauh lebih ketat rate limit-nya daripada
 * yang berbayar, dan tidak semuanya mendukung structured outputs. Yang bisa
 * dipakai di sini hanya model yang punya kemampuan itu — cek daftarnya di
 * https://openrouter.ai/api/v1/models (endpoint publik, tanpa kunci).
 */
class OpenRouterProvider implements AiProvider
{
    private const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

    public function name(): string
    {
        return 'openrouter';
    }

    public function isConfigured(): bool
    {
        return filled(config('services.openrouter.key'));
    }

    public function model(): string
    {
        return (string) config('services.openrouter.model');
    }

    public function paragraphsFor(string $prompt): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('OPENROUTER_API_KEY belum diisi di file .env backend.');
        }

        $response = Http::timeout((int) config('services.ai.timeout'))
            ->withToken((string) config('services.openrouter.key'))
            ->withHeaders([
                // Dipakai OpenRouter untuk atribusi; tidak wajib, tapi disarankan.
                'HTTP-Referer' => (string) config('app.url'),
                'X-Title' => (string) config('app.name'),
            ])
            ->acceptJson()
            ->post(self::ENDPOINT, [
                'model' => $this->model(),
                'temperature' => 0.3,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Kamu membantu pembaca disleksia. Jawab hanya dengan JSON sesuai skema yang diminta, tanpa penjelasan tambahan.',
                    ],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'response_format' => [
                    'type' => 'json_schema',
                    'json_schema' => [
                        'name' => 'paragraphs',
                        'strict' => true,
                        'schema' => [
                            'type' => 'object',
                            'properties' => [
                                'paragraphs' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string'],
                                ],
                            ],
                            'required' => ['paragraphs'],
                            'additionalProperties' => false,
                        ],
                    ],
                ],
            ]);

        if ($response->failed()) {
            Log::warning('Permintaan OpenRouter gagal', [
                'status' => $response->status(),
                'body' => $response->json('error.message') ?? $response->body(),
            ]);

            throw new RuntimeException($this->humanError($response->status(), $response->json('error.message')));
        }

        // OpenRouter kadang membalas 200 tapi isinya error dari model hulu.
        if (filled($upstream = $response->json('error.message'))) {
            Log::warning('OpenRouter membalas 200 dengan error', ['body' => $upstream]);

            throw new RuntimeException("Model menolak permintaan: {$upstream}");
        }

        $raw = $response->json('choices.0.message.content');

        if (blank($raw)) {
            throw new RuntimeException('OpenRouter tidak mengembalikan teks. Coba lagi sebentar.');
        }

        return ParagraphPayload::extract($raw, 'OpenRouter');
    }

    private function humanError(int $status, ?string $detail): string
    {
        return match (true) {
            $status === 401 => 'OPENROUTER_API_KEY tidak valid. Periksa kembali kunci di openrouter.ai/keys.',
            $status === 402 => 'Saldo OpenRouter tidak cukup untuk model ini. Pakai model berakhiran ":free".',
            $status === 429 => 'Rate limit model gratis OpenRouter tercapai. Tunggu sebentar lalu coba lagi.',
            $status === 404 => 'Model "' . $this->model() . '" tidak ditemukan di OpenRouter. Cek ejaannya, termasuk akhiran ":free".',
            $status >= 500 => 'Server OpenRouter sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke OpenRouter gagal.',
        };
    }
}
