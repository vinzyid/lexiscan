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
     * Jumlah token bawaan untuk respons palsu. Nilainya sengaja sama dengan
     * permintaan menengah yang dipakai mengkalibrasi config/footprint.php,
     * sehingga taksiran yang keluar di test bisa dihitung tangan: 0,24 Wh.
     */
    protected const FAKE_PROMPT_TOKENS = 500;

    protected const FAKE_OUTPUT_TOKENS = 400;

    /**
     * @param  array<int, string>  $paragraphs
     * @param  array<string, int>|null  $usage  Timpa jumlah token; null memakai bawaan.
     * @return array<string, mixed>
     */
    protected function geminiBody(array $paragraphs, string $finishReason = 'STOP', ?array $usage = null): array
    {
        return [
            'candidates' => [[
                'content' => ['parts' => [['text' => json_encode(['paragraphs' => $paragraphs])]]],
                'finishReason' => $finishReason,
            ]],
            // Dasar perhitungan jejak karbon; Gemini selalu mengirimkannya.
            'usageMetadata' => $usage ?? [
                'promptTokenCount' => self::FAKE_PROMPT_TOKENS,
                'candidatesTokenCount' => self::FAKE_OUTPUT_TOKENS,
            ],
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
