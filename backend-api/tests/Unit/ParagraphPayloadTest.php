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

    public function test_it_names_the_provider_when_the_response_is_not_json(): void
    {
        $this->expectException(RuntimeException::class);
        // Nama penyedia masuk ke pesan supaya jelas siapa yang bermasalah.
        $this->expectExceptionMessage('Respons Gemini bukan JSON yang bisa dibaca.');

        ParagraphPayload::extract('maaf, saya tidak bisa membantu', 'Gemini');
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
