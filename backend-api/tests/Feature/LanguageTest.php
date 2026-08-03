<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\FakesGemini;
use Tests\TestCase;

/**
 * Parameter `language` pada ketiga endpoint AI. Yang diuji: prompt benar-benar
 * berganti bahasa, cache tidak bocor antar bahasa, dan klien lama tetap dilayani.
 */
class LanguageTest extends TestCase
{
    use FakesGemini;

    private const TEXT = 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau yang memerlukan cahaya matahari.';

    public function test_simplify_uses_an_english_prompt_when_language_is_en(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/simplify-text', [
            'text' => self::TEXT,
            'level' => 'L5',
            'language' => 'en',
        ])->assertOk()->assertJsonPath('language', 'en');

        $prompt = $this->promptSentToGemini();

        $this->assertStringContainsString('Answer in English.', $prompt);
        $this->assertStringContainsString('primary-school reading level', $prompt);
        $this->assertStringNotContainsString('Jawab dalam bahasa Indonesia.', $prompt);
    }

    public function test_simplify_defaults_to_indonesian_when_language_is_omitted(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/simplify-text', ['text' => self::TEXT, 'level' => 'L5'])
            ->assertOk()
            ->assertJsonPath('language', 'id');

        $this->assertStringContainsString('Jawab dalam bahasa Indonesia.', $this->promptSentToGemini());
    }

    public function test_the_two_languages_are_cached_separately(): void
    {
        $this->fakeGeminiSequence([
            [$this->geminiBody(['Versi Indonesia.'])],
            [$this->geminiBody(['English version.'])],
        ]);

        $payload = ['text' => self::TEXT, 'level' => 'L3'];

        $this->postJson('/api/simplify-text', $payload + ['language' => 'id'])
            ->assertJsonPath('paragraphs.0', 'Versi Indonesia.');

        // Tanpa bahasa di kunci cache, permintaan kedua mengambil hasil Indonesia.
        $this->postJson('/api/simplify-text', $payload + ['language' => 'en'])
            ->assertJsonPath('paragraphs.0', 'English version.');

        Http::assertSentCount(2);
    }

    public function test_explain_uses_an_english_prompt_and_english_context_label(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/explain-word', [
            'term' => 'mitochondria',
            'style' => 'anak10',
            'context' => 'The mitochondria produce energy.',
            'language' => 'en',
        ])->assertOk()->assertJsonPath('language', 'en');

        $prompt = $this->promptSentToGemini();

        $this->assertStringContainsString('talking to a 10-year-old', $prompt);
        $this->assertStringContainsString('The sentence the word appears in', $prompt);
        $this->assertStringNotContainsString('Kalimat tempat kata itu muncul', $prompt);
    }

    public function test_explain_is_cached_separately_per_language(): void
    {
        $this->fakeGeminiSequence([
            [$this->geminiBody(['Penjelasan Indonesia.'])],
            [$this->geminiBody(['English explanation.'])],
        ]);

        $payload = ['term' => 'mitokondria', 'style' => 'analogi'];

        $this->postJson('/api/explain-word', $payload + ['language' => 'id'])
            ->assertJsonPath('paragraphs.0', 'Penjelasan Indonesia.');

        $this->postJson('/api/explain-word', $payload + ['language' => 'en'])
            ->assertJsonPath('paragraphs.0', 'English explanation.');
    }

    public function test_correct_typo_uses_an_english_prompt_when_language_is_en(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/correct-typo', [
            'text' => 'The mitochondr1a produce enegry.',
            'language' => 'en',
        ])->assertOk()->assertJsonPath('language', 'en');

        $prompt = $this->promptSentToGemini();

        $this->assertStringContainsString('Restore correct English spelling', $prompt);
        $this->assertStringNotContainsString('sesuai EYD', $prompt);
    }

    public function test_it_rejects_an_unsupported_language(): void
    {
        $this->postJson('/api/simplify-text', [
            'text' => self::TEXT,
            'level' => 'L3',
            'language' => 'fr',
        ])->assertStatus(422)->assertJsonValidationErrors('language');
    }

    public function test_health_reports_the_supported_languages(): void
    {
        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJsonPath('languages', ['id', 'en']);
    }
}
