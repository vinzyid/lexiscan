<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Services\AiTextService;
use App\Services\SystemSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Tests\FakesGemini;
use Tests\TestCase;

/**
 * Dua masukan dosen PLB yang menyentuh prompt, dikunci di sini supaya tidak
 * pelan-pelan kembali seperti semula:
 *
 * 1. Panjang jawaban menyesuaikan kemampuan membaca pembacanya. Penjelasan
 *    panjang justru menyulitkan, dan yang paling membutuhkan bantuan adalah
 *    yang paling dirugikan olehnya.
 * 2. Tidak ada kalimat yang menyamakan kesulitan membaca dengan usia anak-anak
 *    atau jenjang sekolah. Itu diskriminasi, dan modelnya pun tidak
 *    membutuhkannya untuk menulis dengan bahasa sederhana.
 */
class ReadingLevelTest extends TestCase
{
    use FakesGemini;
    use RefreshDatabase;

    private const TEXT = 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau yang memerlukan cahaya matahari.';

    /** Kata yang tidak boleh muncul di prompt mana pun, dalam dua bahasa. */
    private const FORBIDDEN = [
        '10 tahun',
        '10-year-old',
        'anak berusia',
        'sekolah dasar',
        'primary-school',
        'primary school',
    ];

    public function test_the_shortest_cap_reaches_the_prompt_for_a_reader_who_cannot_read_yet(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/explain-word', [
            'term' => 'anabolisme',
            'style' => 'sederhana',
            'reading_level' => 'belum',
        ])->assertOk();

        $prompt = $this->promptSentToGemini();

        $this->assertStringContainsString('SATU paragraf saja, maksimal dua kalimat', $prompt);
        $this->assertStringContainsString('maksimal sepuluh kata', $prompt);
    }

    public function test_a_fluent_reader_gets_a_looser_cap(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/explain-word', [
            'term' => 'anabolisme',
            'style' => 'sederhana',
            'reading_level' => 'lancar',
        ])->assertOk();

        $prompt = $this->promptSentToGemini();

        $this->assertStringContainsString('maksimal dua paragraf pendek', $prompt);
        $this->assertStringNotContainsString('maksimal sepuluh kata', $prompt);
    }

    public function test_simplify_tightens_its_paragraphs_for_a_reader_who_cannot_read_yet(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/simplify-text', [
            'text' => self::TEXT,
            'level' => 'L3',
            'reading_level' => 'belum',
        ])->assertOk();

        $this->assertStringContainsString(
            'Satu paragraf maksimal dua kalimat',
            $this->promptSentToGemini(),
        );
    }

    /**
     * Dua kemampuan membaca yang berbeda menghasilkan prompt yang berbeda, jadi
     * jawabannya tidak boleh saling dipakai dari cache. Kunci simpanannya sudah
     * memuat sidik jari prompt, tapi itu perlu dibuktikan — kalau meleset,
     * gejalanya adalah anak yang belum bisa membaca menerima jawaban panjang
     * milik orang lain.
     */
    public function test_two_reading_levels_do_not_share_one_cached_answer(): void
    {
        $this->fakeGeminiSequence([
            [$this->geminiBody(['Jawaban pendek.'])],
            [$this->geminiBody(['Jawaban yang lebih panjang.'])],
        ]);

        $payload = ['term' => 'anabolisme', 'style' => 'sederhana'];

        $this->postJson('/api/explain-word', $payload + ['reading_level' => 'belum'])
            ->assertJsonPath('paragraphs.0', 'Jawaban pendek.');

        $this->postJson('/api/explain-word', $payload + ['reading_level' => 'lancar'])
            ->assertJsonPath('paragraphs.0', 'Jawaban yang lebih panjang.');
    }

    public function test_an_unknown_reading_level_is_rejected(): void
    {
        $this->postJson('/api/explain-word', [
            'term' => 'anabolisme',
            'style' => 'sederhana',
            'reading_level' => 'tinggi',
        ])->assertStatus(422)->assertJsonValidationErrors('reading_level');
    }

    /** Aplikasi versi lama belum mengirim field ini dan harus tetap dilayani. */
    public function test_a_request_without_a_reading_level_still_works(): void
    {
        $this->fakeGeminiParagraphs(['ok']);

        $this->postJson('/api/explain-word', ['term' => 'anabolisme', 'style' => 'sederhana'])
            ->assertOk();
    }

    public function test_the_retired_style_id_is_no_longer_accepted(): void
    {
        $this->postJson('/api/explain-word', ['term' => 'anabolisme', 'style' => 'anak10'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('style');
    }

    /**
     * Sapuan menyeluruh: tiap gaya penjelasan, tiap bahasa, tiap kemampuan
     * membaca. Satu test yang gagal di sini berarti ada satu jalur prompt yang
     * masih menggambarkan pembacanya lewat usia.
     *
     * Throttle-nya dilepas karena sapuan ini mengirim 42 permintaan sekaligus,
     * jauh di atas batas 20/menit. Yang diuji di sini isi prompt, bukan
     * pembatas laju — dan pembatas lajunya sudah punya testnya sendiri.
     */
    public function test_no_prompt_describes_the_reader_by_age_or_school_grade(): void
    {
        $this->withoutMiddleware(ThrottleRequests::class);

        foreach (['id', 'en'] as $language) {
            foreach (AiTextService::READING_LEVELS as $readingLevel) {
                foreach (['sederhana', 'analogi', 'nyata'] as $style) {
                    $this->fakeGeminiParagraphs(['ok']);

                    $this->postJson('/api/explain-word', [
                        'term' => 'anabolisme',
                        'style' => $style,
                        'language' => $language,
                        'reading_level' => $readingLevel,
                    ])->assertOk();

                    $this->assertPromptIsInclusive($this->promptSentToGemini(), "explain/{$language}/{$style}");
                }

                foreach (['L2', 'L3', 'L4', 'L5'] as $level) {
                    $this->fakeGeminiParagraphs(['ok']);

                    $this->postJson('/api/simplify-text', [
                        'text' => self::TEXT,
                        'level' => $level,
                        'language' => $language,
                        'reading_level' => $readingLevel,
                    ])->assertOk();

                    $this->assertPromptIsInclusive($this->promptSentToGemini(), "simplify/{$language}/{$level}");
                }
            }
        }
    }

    /**
     * Aturan lama yang tersimpan di tabel `settings` tidak boleh menghidupkan
     * kembali gaya yang sudah dipensiunkan. Kalau saringannya lepas, gejalanya
     * halus: 'anak10' muncul lagi sebagai kolom yang bisa disunting admin,
     * padahal API menolaknya — admin menyunting sesuatu yang tidak berpengaruh.
     */
    public function test_a_retired_style_stored_by_an_admin_is_ignored(): void
    {
        Setting::create([
            'key' => SystemSettings::KEY_EXPLAIN_STYLES,
            'value' => ['id' => ['anak10' => 'Aturan lama yang masih tersimpan.']],
        ]);

        $styles = app(AiTextService::class)->explainStyles();

        $this->assertArrayNotHasKey('anak10', $styles['id']);
        $this->assertArrayHasKey('sederhana', $styles['id']);
    }

    private function assertPromptIsInclusive(string $prompt, string $where): void
    {
        foreach (self::FORBIDDEN as $phrase) {
            $this->assertStringNotContainsStringIgnoringCase(
                $phrase,
                $prompt,
                "Prompt {$where} masih menggambarkan pembacanya lewat usia atau jenjang sekolah.",
            );
        }
    }
}
