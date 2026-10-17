<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;
use ZipArchive;

/** POST /api/extract-document — teks dari PDF dan DOCX yang diunggah. */
class ExtractDocumentTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_reads_each_word_paragraph_as_its_own_line(): void
    {
        $file = $this->docx([
            'Fotosintesis adalah proses tumbuhan membuat makanan.',
            'Tumbuhan butuh cahaya &amp; air.',
        ]);

        $this->post('/api/extract-document', ['file' => $file], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath(
                'text',
                "Fotosintesis adalah proses tumbuhan membuat makanan.\nTumbuhan butuh cahaya & air.",
            );
    }

    public function test_it_reads_text_from_a_pdf(): void
    {
        $file = UploadedFile::fake()->createWithContent('bacaan.pdf', $this->pdf('Halo dunia'));

        $this->post('/api/extract-document', ['file' => $file], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('text', 'Halo dunia');
    }

    public function test_a_broken_file_gets_a_readable_message(): void
    {
        $file = UploadedFile::fake()->createWithContent('rusak.docx', 'bukan zip');

        $this->post('/api/extract-document', ['file' => $file], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Berkas Word ini tidak bisa dibuka. Pastikan formatnya .docx, bukan .doc lama.');
    }

    public function test_other_file_types_are_rejected(): void
    {
        $file = UploadedFile::fake()->createWithContent('catatan.txt', 'halo');

        $this->post('/api/extract-document', ['file' => $file], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('file');
    }

    /** @param  list<string>  $paragraphs */
    private function docx(array $paragraphs): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'docx');
        $body = implode('', array_map(
            fn (string $p) => "<w:p><w:r><w:t>{$p}</w:t></w:r></w:p>",
            $paragraphs,
        ));

        $zip = new ZipArchive;
        $zip->open($path, ZipArchive::OVERWRITE);
        $zip->addFromString(
            'word/document.xml',
            '<?xml version="1.0" encoding="UTF-8"?>'
            .'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            ."<w:body>{$body}</w:body></w:document>",
        );
        $zip->close();

        return UploadedFile::fake()->createWithContent('bacaan.docx', file_get_contents($path));
    }

    /** PDF satu halaman paling sederhana yang masih sah, berisi satu baris teks. */
    private function pdf(string $text): string
    {
        $stream = "BT /F1 12 Tf 72 720 Td ({$text}) Tj ET";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
            '<< /Length '.strlen($stream)." >>\nstream\n{$stream}\nendstream",
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $i => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($i + 1)." 0 obj\n{$object}\nendobj\n";
        }

        $xref = strlen($pdf);
        $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf.'trailer << /Size '.(count($objects) + 1)." /Root 1 0 R >>\nstartxref\n{$xref}\n%%EOF";
    }
}
