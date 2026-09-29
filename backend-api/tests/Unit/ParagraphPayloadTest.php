<?php

namespace Tests\Unit;

use App\Services\Ai\ParagraphPayload;
use RuntimeException;
use Tests\TestCase;

/**
 * Pembersih respons LLM. Model kecil sering tidak menuruti permintaan
 * "JSON saja", jadi kelas ini yang menahan variasinya.
 */
class ParagraphPayloadTest extends TestCase
{
    public function test_it_reads_a_plain_json_object(): void
    {
        $this->assertSame(
            ['Paragraf satu.', 'Paragraf dua.'],
            ParagraphPayload::extract('{"paragraphs":["Paragraf satu.","Paragraf dua."]}', 'Uji'),
        );
    }

    public function test_it_unwraps_a_markdown_fenced_block(): void
    {
        $raw = "```json\n{\"paragraphs\":[\"Di dalam fence.\"]}\n```";

        $this->assertSame(['Di dalam fence.'], ParagraphPayload::extract($raw, 'Uji'));
    }

    public function test_it_unwraps_a_fence_without_a_language_tag(): void
    {
        $raw = "```\n{\"paragraphs\":[\"Tanpa tag bahasa.\"]}\n```";

        $this->assertSame(['Tanpa tag bahasa.'], ParagraphPayload::extract($raw, 'Uji'));
    }

    public function test_it_ignores_chatter_around_the_json(): void
    {
        $raw = 'Tentu! Ini hasilnya: {"paragraphs":["Isi sebenarnya."]} Semoga membantu.';

        $this->assertSame(['Isi sebenarnya.'], ParagraphPayload::extract($raw, 'Uji'));
    }

    public function test_it_trims_and_drops_blank_paragraphs(): void
    {
        $raw = '{"paragraphs":["  Ada isi.  ","","   "]}';

        $this->assertSame(['Ada isi.'], ParagraphPayload::extract($raw, 'Uji'));
    }

    public function test_it_drops_non_scalar_entries(): void
    {
        // Model kadang menyisipkan objek di tengah array string.
        $raw = '{"paragraphs":["Teks sah.",{"aneh":true},["juga aneh"]]}';

        $this->assertSame(['Teks sah.'], ParagraphPayload::extract($raw, 'Uji'));
    }

    public function test_it_uses_plain_text_when_the_model_ignores_the_json_format(): void
    {
        // Model kadang membalas teks biasa padahal isinya sudah benar. Dulu ini
        // dibuang dan pengguna melihat galat untuk jawaban yang sebenarnya bagus.
        $this->assertSame(
            ['Fotosintesis adalah cara tumbuhan membuat makanan.'],
            ParagraphPayload::extract('Fotosintesis adalah cara tumbuhan membuat makanan.', 'Gemini'),
        );
    }

    public function test_it_splits_plain_text_into_paragraphs_on_blank_lines(): void
    {
        $raw = "Paragraf pertama.\n\nParagraf kedua.\n\n\nParagraf ketiga.";

        $this->assertSame(
            ['Paragraf pertama.', 'Paragraf kedua.', 'Paragraf ketiga.'],
            ParagraphPayload::extract($raw, 'Gemini'),
        );
    }

    public function test_it_keeps_a_multiline_paragraph_together(): void
    {
        // Satu paragraf yang terpotong newline tunggal tidak boleh dipecah.
        $raw = "Satu kalimat.\nMasih kalimat yang sama.";

        $this->assertSame(
            ["Satu kalimat.\nMasih kalimat yang sama."],
            ParagraphPayload::extract($raw, 'Gemini'),
        );
    }

    public function test_it_still_rejects_a_plain_text_refusal(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Respons Gemini bukan JSON yang bisa dibaca.');

        ParagraphPayload::extract('Maaf, saya tidak bisa membantu permintaan itu.', 'Gemini');
    }

    public function test_it_still_rejects_an_empty_plain_text_response(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Respons Gemini bukan JSON yang bisa dibaca.');

        ParagraphPayload::extract('   ', 'Gemini');
    }

    public function test_it_fails_when_every_paragraph_is_empty(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Hasil dari Gemini kosong setelah diproses.');

        ParagraphPayload::extract('{"paragraphs":["","  "]}', 'Gemini');
    }

    public function test_it_fails_when_the_paragraphs_key_is_missing(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Hasil dari Gemini kosong setelah diproses.');

        ParagraphPayload::extract('{"hasil":["salah kunci"]}', 'Gemini');
    }
}
