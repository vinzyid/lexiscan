<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\FakesGemini;
use Tests\TestCase;

/** POST /api/correct-typo — merapikan hasil OCR yang salah baca. */
class CorrectTypoTest extends TestCase
{
    use FakesGemini;

    private const SCANNED = 'Pr0ses f0t0sintesis terjadl pada tumbuhan hljau.';

    public function test_it_returns_the_corrected_paragraphs(): void
    {
        $this->fakeGeminiParagraphs(['Proses fotosintesis terjadi pada tumbuhan hijau.']);

        $this->postJson('/api/correct-typo', ['text' => self::SCANNED])
            ->assertOk()
            ->assertJson([
                'paragraphs' => ['Proses fotosintesis terjadi pada tumbuhan hijau.'],
                'provider' => 'gemini',
            ]);
    }

    public function test_the_prompt_forbids_summarising(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/correct-typo', ['text' => self::SCANNED])->assertOk();

        // Tanpa larangan ini model cenderung meringkas, bukan memperbaiki ejaan.
        $this->assertStringContainsString('JANGAN merangkum', $this->promptSentToGemini());
    }

    public function test_repeated_scans_always_reach_the_provider(): void
    {
        $this->fakeGeminiSequence([
            [$this->geminiBody(['Koreksi pertama.'])],
            [$this->geminiBody(['Koreksi kedua.'])],
        ]);

        $this->postJson('/api/correct-typo', ['text' => self::SCANNED])
            ->assertJsonPath('paragraphs.0', 'Koreksi pertama.');

        /*
         * Sengaja tidak di-cache: pengguna sering memfoto ulang halaman yang
         * sama dari sudut berbeda dan berharap hasil yang lebih baik, bukan
         * jawaban lama yang diulang.
         */
        $this->postJson('/api/correct-typo', ['text' => self::SCANNED])
            ->assertJsonPath('paragraphs.0', 'Koreksi kedua.');

        Http::assertSentCount(2);
    }

    public function test_it_rejects_text_too_short_to_be_a_scan(): void
    {
        $this->postJson('/api/correct-typo', ['text' => 'abc'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('text');
    }

    public function test_it_rejects_a_scan_larger_than_one_page(): void
    {
        $this->postJson('/api/correct-typo', ['text' => str_repeat('a', 8001)])
            ->assertStatus(422)
            ->assertJsonValidationErrors('text');
    }

    public function test_it_accepts_a_full_page_of_ocr_text(): void
    {
        $this->fakeGeminiParagraphs(['Halaman penuh yang sudah rapi.']);

        // 8000 karakter adalah batas atas yang didukung, bukan yang ditolak.
        $this->postJson('/api/correct-typo', ['text' => str_repeat('a', 8000)])
            ->assertOk()
            ->assertJsonPath('paragraphs.0', 'Halaman penuh yang sudah rapi.');
    }
}
