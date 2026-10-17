<?php

namespace App\Services;

use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;
use Throwable;
use ZipArchive;

/**
 * Mengambil teks dari berkas PDF dan DOCX yang diunggah lewat layar Pindai.
 *
 * Dikerjakan di server, bukan di HP, karena pembaca PDF yang andal tidak ada
 * yang berjalan di mesin JavaScript aplikasi, dan menambah modul native berarti
 * pembaruan OTA tidak bisa dipakai sampai APK dibangun ulang.
 *
 * Yang diambil hanya teks yang memang tersimpan sebagai teks. PDF hasil
 * pindaian (isinya gambar halaman) tidak punya teks sama sekali, dan untuk itu
 * jalan keluarnya adalah memotret halamannya, bukan OCR di server.
 */
class DocumentTextExtractor
{
    /** Menyamai batas teks yang boleh dikirim ke penyederhanaan AI. */
    public const MAX_CHARS = 8000;

    public const TYPE_PDF = 'pdf';

    public const TYPE_DOCX = 'docx';

    public function extract(string $path, string $type): string
    {
        $text = match ($type) {
            self::TYPE_PDF => $this->fromPdf($path),
            self::TYPE_DOCX => $this->fromDocx($path),
        };

        return mb_substr($this->tidy($text), 0, self::MAX_CHARS);
    }

    private function fromPdf(string $path): string
    {
        try {
            return (new PdfParser)->parseFile($path)->getText();
        } catch (Throwable) {
            // Termasuk PDF yang dikunci kata sandi: pesannya sama bagi pengguna.
            throw new RuntimeException('PDF ini tidak bisa dibuka. Coba simpan ulang PDF-nya, atau foto halamannya.');
        }
    }

    /**
     * DOCX adalah arsip zip; isinya ada di word/document.xml. Tiap paragraf
     * Word (`w:p`) dijadikan satu baris, karena layar Baca membagi paragraf
     * per baris.
     */
    private function fromDocx(string $path): string
    {
        $zip = new ZipArchive;

        if ($zip->open($path) !== true) {
            throw new RuntimeException('Berkas Word ini tidak bisa dibuka. Pastikan formatnya .docx, bukan .doc lama.');
        }

        $xml = $zip->getFromName('word/document.xml');
        $zip->close();

        if ($xml === false) {
            throw new RuntimeException('Berkas Word ini tidak bisa dibuka. Pastikan formatnya .docx, bukan .doc lama.');
        }

        $xml = preg_replace('/<w:tab\b[^>]*\/>/', ' ', $xml);
        $xml = preg_replace('/<w:(br|cr)\b[^>]*\/>/', "\n", $xml);
        $xml = preg_replace('/<\/w:p>/', "\n", $xml);

        return html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    /** Spasi berlebih dirapikan dan baris kosong beruntun dijadikan satu. */
    private function tidy(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[ \t\x{00A0}]+/u', ' ', $text);
        $text = preg_replace('/ *\n */', "\n", $text);
        $text = preg_replace('/\n{2,}/', "\n", $text);

        return trim($text);
    }
}
