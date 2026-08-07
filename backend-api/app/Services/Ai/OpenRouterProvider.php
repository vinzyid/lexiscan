<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * OpenRouter — banyak model lewat satu kunci, OpenAI-compatible.
 *
 * Model gratis (":free") rate limit-nya ketat dan tidak semuanya mendukung
 * structured outputs; hanya yang mendukung itu yang bisa dipakai di sini.
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

    public function paragraphsFor(string $prompt): LlmResult
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('OPENROUTER_API_KEY belum diisi di file .env backend.');
        }

        $response = LlmHttp::client($this->name())
            ->withToken((string) config('services.openrouter.key'))
            ->withHeaders([
                // Dipakai OpenRouter untuk atribusi; tidak wajib, tapi disarankan.
                'HTTP-Referer' => (string) config('app.url'),
                'X-Title' => (string) config('app.name'),
            ])
            ->post(self::ENDPOINT, [
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

        return new LlmResult(
            ParagraphPayload::extract($raw, 'OpenRouter'),
            TokenUsage::fromOpenAi($response->json('usage')),
        );
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
