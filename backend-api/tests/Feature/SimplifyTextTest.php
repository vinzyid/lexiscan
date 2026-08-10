<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\FakesGemini;
use Tests\TestCase;

/** POST /api/simplify-text — fitur AI Text Simplification (level L2–L5). */
class SimplifyTextTest extends TestCase
{
    use FakesGemini;

    private const TEXT = 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau yang memerlukan cahaya matahari.';

    /** L1 sengaja tidak ikut: itu teks asli dan tidak pernah menyentuh backend. */
    public static function supportedLevels(): array
    {
        return [['L2'], ['L3'], ['L4'], ['L5']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('supportedLevels')]
    public function test_it_returns_paragraphs_for_a_supported_level(string $level): void
    {
        $this->fakeGeminiParagraphs(["Hasil untuk {$level}."]);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => $level])
            ->assertOk()
            ->assertJson([
                'level' => $level,
                'paragraphs' => ["Hasil untuk {$level}."],
                'provider' => 'gemini',
            ]);
    }

    public function test_it_sends_the_level_specific_rule_in_the_prompt(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L5'])->assertOk();

        $prompt = $this->promptSentToGemini();

        // Aturan L5 harus ikut, kalau tidak semua level menghasilkan teks yang sama.
        $this->assertStringContainsString('kata yang paling umum dipakai sehari-hari', $prompt);
        $this->assertStringContainsString(self::TEXT, $prompt);
    }

    public function test_identical_requests_reuse_the_cached_result(): void
    {
        $this->fakeGeminiParagraphs(['Sekali saja.']);

        $payload = ['text' => self::TEXT, 'level' => 'L3'];

        $this->postJson('/api/simplify-text', $payload)->assertOk();
        $this->postJson('/api/simplify-text', $payload)->assertOk()->assertJsonPath('paragraphs.0', 'Sekali saja.');

        // Kuota LLM gratis terbatas; permintaan kedua tidak boleh menembus ke penyedia.
        Http::assertSentCount(1);
    }

    public function test_different_levels_are_cached_separately(): void
    {
        $this->fakeGeminiSequence([
            [$this->geminiBody(['Versi L2.'])],
            [$this->geminiBody(['Versi L3.'])],
        ]);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L2'])
            ->assertJsonPath('paragraphs.0', 'Versi L2.');

        // Kunci cache memuat level, jadi L3 tidak boleh mengambil hasil L2.
        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertJsonPath('paragraphs.0', 'Versi L3.');
    }

    public function test_provider_failure_is_reported_as_503_not_500(): void
    {
        $this->fakeGeminiFailure(403, 'kunci ditolak');

        // 503 supaya aplikasi bisa membedakan masalah penyedia dari 422 salah input.
        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Kunci Gemini ditolak. Pastikan kunci masih aktif di Google AI Studio.');
    }

    public function test_it_reports_when_the_text_was_truncated_by_the_model(): void
    {
        Http::fake([
            'generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [['content' => ['parts' => []], 'finishReason' => 'MAX_TOKENS']],
            ]),
        ]);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L3'])
            ->assertStatus(503)
            ->assertJsonPath('message', 'Teksnya terlalu panjang untuk diproses sekaligus. Pindai bagian yang lebih pendek.');
    }

    public function test_it_rejects_an_unknown_level(): void
    {
        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L9'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('level');
    }

    public function test_it_rejects_l1_because_that_is_the_original_text(): void
    {
        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L1'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('level');
    }

    public function test_it_rejects_missing_and_oversized_text(): void
    {
        $this->postJson('/api/simplify-text', ['level' => 'L3'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('text');

        $this->postJson('/api/simplify-text', ['text' => str_repeat('a', 8001), 'level' => 'L3'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('text');
    }

    public function test_validation_messages_are_in_indonesian(): void
    {
        // Aplikasi mobile menampilkan `message` mentah ke pembaca disleksia.
        $this->postJson('/api/simplify-text', ['level' => 'L3'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Kolom teks wajib diisi.');
    }
}
