<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Mistral AI (La Plateforme). API-nya OpenAI-compatible.
 *
 * Dipakai sebagai cadangan kalau kuota Gemini habis di tengah demo. Mistral
 * mendukung `response_format: json_object`, tapi tidak menjamin skema seperti
 * Gemini `responseSchema` — jaring pengamannya ada di ParagraphPayload.
 */
class MistralProvider implements AiProvider
{
    private const ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';

    public function name(): string
    {
        return 'mistral';
    }

    public function isConfigured(): bool
    {
        return filled(config('services.mistral.key'));
    }

    public function model(): string
    {
        return (string) config('services.mistral.model');
    }

    public function paragraphsFor(string $prompt): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('MISTRAL_API_KEY belum diisi di file .env backend.');
        }

        $response = LlmHttp::client($this->name())
            ->withToken((string) config('services.mistral.key'))
            ->post(self::ENDPOINT, [
                'model' => $this->model(),
                'temperature' => 0.3,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Kamu membantu pembaca disleksia berbahasa Indonesia. Jawab hanya dengan JSON dalam format {"paragraphs": ["teks paragraf 1", "teks paragraf 2"]}, tanpa penjelasan tambahan.',
                    ],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'response_format' => ['type' => 'json_object'],
            ]);

        if ($response->failed()) {
            Log::warning('Permintaan Mistral gagal', [
                'status' => $response->status(),
                'body' => $response->json('message') ?? $response->json('error.message') ?? $response->body(),
            ]);

            throw new RuntimeException($this->humanError(
                $response->status(),
                $response->json('error.message') ?? (is_string($response->json('message')) ? $response->json('message') : null),
            ));
        }

        $raw = $response->json('choices.0.message.content');

        if (blank($raw)) {
            throw new RuntimeException('Mistral tidak mengembalikan teks. Coba lagi sebentar.');
        }

        return ParagraphPayload::extract($raw, 'Mistral');
    }

    private function humanError(int $status, ?string $detail): string
    {
        return match (true) {
            $status === 401 => 'MISTRAL_API_KEY tidak valid. Periksa kembali kunci di console.mistral.ai.',
            $status === 402 => 'Langganan Mistral tidak aktif atau kredit habis. Cek di console.mistral.ai/billing.',
            $status === 429 => 'Rate limit Mistral tercapai. Tunggu sebentar lalu coba lagi.',
            // Model yang tidak ada di langganan ditolak sebagai 400, bukan 404.
            $status === 400 && str_contains((string) $detail, 'model') => 'Model "' . $this->model() . '" tidak tersedia untuk akunmu. Cek daftar model di /v1/models.',
            $status === 404 => 'Model "' . $this->model() . '" tidak ditemukan di Mistral. Cek ejaan namanya.',
            $status >= 500 => 'Server Mistral sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke Mistral gagal.',
        };
    }
}
