<?php

namespace App\Http\Controllers;

use App\Services\DocumentTextExtractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class DocumentController extends Controller
{
    public function __construct(private readonly DocumentTextExtractor $extractor) {}

    /**
     * POST /api/extract-document — teks dari PDF atau DOCX yang diunggah.
     *
     * Tidak memakai kuota LLM. Berkasnya tidak disimpan: dibaca dari folder
     * sementara lalu dibuang bersama permintaannya.
     */
    public function extract(Request $request): JsonResponse
    {
        $request->validate([
            // 10 MB: cukup untuk buku pelajaran per bab, tidak cukup untuk
            // menjadikan endpoint ini tempat membuang berkas besar. Dicek dari
            // ekstensinya: deteksi isi PHP sering mengira DOCX sebagai zip biasa.
            'file' => ['required', 'file', 'max:10240', 'extensions:pdf,docx'],
        ]);

        $file = $request->file('file');
        $type = strtolower($file->getClientOriginalExtension()) === 'docx'
            ? DocumentTextExtractor::TYPE_DOCX
            : DocumentTextExtractor::TYPE_PDF;

        try {
            $text = $this->extractor->extract($file->getRealPath(), $type);
        } catch (RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        if ($text === '') {
            return response()->json([
                'message' => $type === DocumentTextExtractor::TYPE_PDF
                    ? 'PDF ini berisi gambar, bukan teks. Foto halamannya dengan kamera supaya bisa dibaca.'
                    : 'Berkas Word ini kosong.',
            ], 422);
        }

        return response()->json(['text' => $text]);
    }
}
