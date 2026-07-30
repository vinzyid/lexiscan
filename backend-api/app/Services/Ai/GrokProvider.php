<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * xAI (Grok). API-nya OpenAI-compatible, jadi bentuk request mengikuti
 * /chat/completions dengan response_format json_schema untuk menjamin
 * hasilnya selalu array paragraf.
 */
class GrokProvider implements AiProvider
{
    private const ENDPOINT = 'https://api.x.ai/v1/chat/completions';

    public function name(): string
    {
        return 'grok';
    }

    public function isConfigured(): bool
    {
        return filled(config('services.grok.key'));
    }

    public function model(): string
    {
        return (string) config('services.grok.model');
    }

    public function paragraphsFor(string $prompt): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('XAI_API_KEY belum diisi di file .env backend.');
        }

        $response = LlmHttp::client($this->name())
            ->withToken((string) config('services.grok.key'))
            ->post(self::ENDPOINT, [
                'model' => $this->model(),
                'temperature' => 0.3,
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Kamu membantu pembaca disleksia. Jawab hanya dengan JSON sesuai skema yang diminta.',
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
            Log::warning('Permintaan Grok gagal', [
                'status' => $response->status(),
                'body' => $response->json('error.message') ?? $response->json('error') ?? $response->body(),
            ]);

            throw new RuntimeException($this->humanError(
                $response->status(),
                is_string($response->json('error')) ? $response->json('error') : $response->json('error.message'),
            ));
        }

        $raw = $response->json('choices.0.message.content');

        if (blank($raw)) {
            throw new RuntimeException('Grok tidak mengembalikan teks. Coba lagi sebentar.');
        }

        return ParagraphPayload::extract($raw, 'Grok');
    }

    private function humanError(int $status, ?string $detail): string
    {
        return match (true) {
            $status === 429 => 'Rate limit Grok tercapai. Tunggu sebentar lalu coba lagi.',
            $status === 401 => 'XAI_API_KEY tidak valid. Periksa kembali kunci di console.x.ai.',
            $status === 403 => 'Kunci Grok ditolak. Pastikan kredit akun xAI masih ada.',
            // Model yang tidak ada di akun ditolak sebagai 404, bukan 400.
            $status === 404 => 'Model "' . $this->model() . '" tidak tersedia untuk akunmu. Cek daftar model di /v1/models.',
            $status >= 500 => 'Server Grok sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke Grok gagal.',
        };
    }
}
