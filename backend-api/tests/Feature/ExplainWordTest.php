<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\FakesGemini;
use Tests\TestCase;

/** POST /api/explain-word — fitur AI Explain This. */
class ExplainWordTest extends TestCase
{
    use FakesGemini;

    public static function supportedStyles(): array
    {
        return [['anak10'], ['analogi'], ['nyata']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('supportedStyles')]
    public function test_it_explains_a_term_in_each_supported_style(string $style): void
    {
        $this->fakeGeminiParagraphs(["Penjelasan gaya {$style}."]);

        $this->postJson('/api/explain-word', ['term' => 'anabolisme', 'style' => $style])
            ->assertOk()
            ->assertJson([
                'style' => $style,
                'paragraphs' => ["Penjelasan gaya {$style}."],
                'provider' => 'gemini',
            ]);
    }

    public function test_context_is_optional(): void
    {
        $this->fakeGeminiParagraphs(['Penjelasan tanpa konteks.']);

        $this->postJson('/api/explain-word', ['term' => 'kloroplas', 'style' => 'anak10'])
            ->assertOk()
            ->assertJsonPath('paragraphs.0', 'Penjelasan tanpa konteks.');
    }

    public function test_the_same_term_in_a_different_context_is_not_served_from_cache(): void
    {
        $this->fakeGeminiSequence([
            [$this->geminiBody(['Arti dalam biologi.'])],
            [$this->geminiBody(['Arti dalam ekonomi.'])],
        ]);

        $this->postJson('/api/explain-word', [
            'term' => 'produksi',
            'style' => 'nyata',
            'context' => 'Produksi glukosa pada tumbuhan.',
        ])->assertJsonPath('paragraphs.0', 'Arti dalam biologi.');

        /*
         * Konteks ikut ke dalam kunci cache. Kalau tidak, kata yang sama di
         * halaman berbeda akan dijelaskan dengan arti yang salah.
         */
        $this->postJson('/api/explain-word', [
            'term' => 'produksi',
            'style' => 'nyata',
            'context' => 'Produksi barang di pabrik.',
        ])->assertJsonPath('paragraphs.0', 'Arti dalam ekonomi.');
    }

    public function test_it_rejects_an_unknown_style(): void
    {
        $this->postJson('/api/explain-word', ['term' => 'anabolisme', 'style' => 'ngawur'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('style');
    }

    public function test_it_rejects_a_missing_term(): void
    {
        $this->postJson('/api/explain-word', ['style' => 'anak10'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('term');
    }

    public function test_it_rejects_a_term_longer_than_a_highlight_could_be(): void
    {
        $this->postJson('/api/explain-word', ['term' => str_repeat('a', 201), 'style' => 'anak10'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('term');
    }

    public function test_it_rejects_oversized_context(): void
    {
        $this->postJson('/api/explain-word', [
            'term' => 'anabolisme',
            'style' => 'anak10',
            'context' => str_repeat('a', 2001),
        ])->assertStatus(422)->assertJsonValidationErrors('context');
    }

    public function test_a_rate_limited_provider_is_reported_as_503(): void
    {
        // 429 dari penyedia diulang dulu; kalau tetap gagal barulah jadi 503.
        $this->fakeGeminiFailure(429);

        $this->postJson('/api/explain-word', ['term' => 'anabolisme', 'style' => 'anak10'])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Kuota harian Gemini gratis sudah habis. Coba lagi besok atau kurangi permintaan.');

        // Percobaan pertama + 2 ulangan.
        Http::assertSentCount(3);
    }

    public function test_an_unreadable_provider_response_is_reported_as_503(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [['content' => ['parts' => [['text' => 'ini bukan JSON']]], 'finishReason' => 'STOP']],
            ]),
        ]);

        $this->postJson('/api/explain-word', ['term' => 'anabolisme', 'style' => 'anak10'])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Respons Gemini bukan JSON yang bisa dibaca.');
    }
}
