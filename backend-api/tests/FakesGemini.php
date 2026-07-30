<?php

namespace Tests;

use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

/**
 * Membentuk respons Gemini palsu dengan struktur yang sama seperti aslinya,
 * supaya test menguji jalur parsing yang benar-benar dipakai di produksi.
 */
trait FakesGemini
{
    /** Pola URL Gemini; dipakai semua helper di trait ini. */
    private const GEMINI_URL = 'generativelanguage.googleapis.com/*';

    /**
     * @param  array<int, string>  $paragraphs
     */
    protected function fakeGeminiParagraphs(array $paragraphs): void
    {
        Http::fake([
            self::GEMINI_URL => Http::response($this->geminiBody($paragraphs)),
        ]);
    }

    /**
     * Balasan berurutan: dipakai untuk menguji ulangan dan pemisahan cache.
     *
     * @param  array<int, array{0: array<string, mixed>, 1?: int}>  $responses  Pasangan [body, status].
     */
    protected function fakeGeminiSequence(array $responses): void
    {
        $sequence = Http::fakeSequence(self::GEMINI_URL);

        foreach ($responses as $response) {
            $sequence->push($response[0], $response[1] ?? 200);
        }
    }

    protected function fakeGeminiFailure(int $status, string $message = 'gagal'): void
    {
        Http::fake([
            self::GEMINI_URL => Http::response(['error' => ['message' => $message]], $status),
        ]);
    }

    /**
     * @param  array<int, string>  $paragraphs
     * @return array<string, mixed>
     */
    protected function geminiBody(array $paragraphs, string $finishReason = 'STOP'): array
    {
        return [
            'candidates' => [[
                'content' => ['parts' => [['text' => json_encode(['paragraphs' => $paragraphs])]]],
                'finishReason' => $finishReason,
            ]],
        ];
    }

    /** Prompt yang benar-benar dikirim ke Gemini pada permintaan ke-$index. */
    protected function promptSentToGemini(int $index = 0): string
    {
        $requests = Http::recorded();

        /** @var Request $request */
        $request = $requests[$index][0];

        return (string) data_get($request->data(), 'contents.0.parts.0.text');
    }
}
