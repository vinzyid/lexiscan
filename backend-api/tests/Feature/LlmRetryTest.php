<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\FakesGemini;
use Tests\TestCase;

/**
 * Kebijakan coba-ulang di LlmHttp. Model gratis rutin membalas 429 sesaat,
 * dan tanpa ulangan kegagalan itu langsung terlihat sebagai error di layar.
 */
class LlmRetryTest extends TestCase
{
    use FakesGemini;

    private const TEXT = 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.';

    public function test_it_recovers_from_a_transient_rate_limit(): void
    {
        $this->fakeGeminiSequence([
            [['error' => ['message' => 'rate limited']], 429],
            [$this->geminiBody(['Berhasil di percobaan kedua.'])],
        ]);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertOk()
            ->assertJsonPath('paragraphs.0', 'Berhasil di percobaan kedua.');

        Http::assertSentCount(2);
    }

    public function test_it_recovers_from_a_transient_server_error(): void
    {
        $this->fakeGeminiSequence([
            [['error' => ['message' => 'internal']], 503],
            [$this->geminiBody(['Berhasil setelah 503.'])],
        ]);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertOk()
            ->assertJsonPath('paragraphs.0', 'Berhasil setelah 503.');

        Http::assertSentCount(2);
    }

    public function test_it_gives_up_after_three_attempts(): void
    {
        $this->fakeGeminiFailure(429);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertStatus(503);

        // Percobaan pertama + 2 ulangan, lalu berhenti — bukan mengulang tanpa batas.
        Http::assertSentCount(3);
    }

    public function test_a_client_error_is_not_retried(): void
    {
        // 403 (kunci ditolak) tidak akan membaik dengan diulang; jangan buang waktu.
        $this->fakeGeminiFailure(403, 'kunci ditolak');

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertStatus(503);

        Http::assertSentCount(1);
    }

    public function test_a_bad_request_is_not_retried(): void
    {
        $this->fakeGeminiFailure(400, 'API key not valid');

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertStatus(503);

        Http::assertSentCount(1);
    }
}
