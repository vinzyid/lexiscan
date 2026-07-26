<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Google Gemini lewat Google AI Studio. Memakai responseSchema supaya
 * hasilnya selalu array paragraf, bukan teks bebas yang harus ditebak.
 */
class GeminiProvider implements AiProvider
{
    private const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

    public function name(): string
    {
        return 'gemini';
    }

    public function isConfigured(): bool
    {
        return filled(config('services.gemini.key'));
    }

    public function model(): string
    {
        return (string) config('services.gemini.model');
    }

    public function paragraphsFor(string $prompt): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('GEMINI_API_KEY belum diisi di file .env backend.');
        }

        $response = Http::timeout((int) config('services.ai.timeout'))
            ->withHeaders(['x-goog-api-key' => (string) config('services.gemini.key')])
            ->acceptJson()
            ->post(self::ENDPOINT . '/' . $this->model() . ':generateContent', [
                'contents' => [
                    ['parts' => [['text' => $prompt]]],
                ],
                'generationConfig' => [
                    'temperature' => 0.3,
                    'responseMimeType' => 'application/json',
                    'responseSchema' => [
                        'type' => 'object',
                        'properties' => [
                            'paragraphs' => [
                                'type' => 'array',
                                'items' => ['type' => 'string'],
                            ],
                        ],
                        'required' => ['paragraphs'],
                    ],
                ],
            ]);

        if ($response->failed()) {
            // Pesan asli dicatat supaya kuota habis vs kunci salah bisa dibedakan.
            Log::warning('Permintaan Gemini gagal', [
                'status' => $response->status(),
                'body' => $response->json('error.message') ?? $response->body(),
            ]);

            throw new RuntimeException($this->humanError($response->status(), $response->json('error.message')));
        }

        $raw = $response->json('candidates.0.content.parts.0.text');

        if (blank($raw)) {
            throw new RuntimeException('Gemini tidak mengembalikan teks. Coba lagi sebentar.');
        }

        return ParagraphPayload::extract($raw, 'Gemini');
    }

    private function humanError(int $status, ?string $detail): string
    {
        return match (true) {
            $status === 429 => 'Kuota harian Gemini gratis sudah habis. Coba lagi besok atau kurangi permintaan.',
            $status === 400 && str_contains((string) $detail, 'API key') => 'GEMINI_API_KEY tidak valid. Periksa kembali kuncinya.',
            $status === 403 => 'Kunci Gemini ditolak. Pastikan kunci masih aktif di Google AI Studio.',
            $status >= 500 => 'Server Gemini sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke Gemini gagal.',
        };
    }
}
