<?php

namespace App\Http\Controllers;

use App\Services\AiTextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

class AiController extends Controller
{
    public function __construct(private readonly AiTextService $ai) {}

    /**
     * POST /api/simplify-text — level L2 sampai L5 untuk fitur AI Simplification.
     * L1 tidak ada di sini karena itu teks asli, tidak perlu diproses AI.
     */
    public function simplify(Request $request): JsonResponse
    {
        $data = $request->validate([
            // 8000 karakter kira-kira sehalaman penuh hasil OCR; di atas itu latensi jadi tidak nyaman.
            'text' => ['required', 'string', 'min:10', 'max:8000'],
            'level' => ['required', 'string', Rule::in($this->ai->availableSimplifyLevels())],
        ]);

        try {
            $paragraphs = $this->ai->simplify($data['text'], $data['level']);
        } catch (RuntimeException $e) {
            return $this->failure($e);
        }

        return response()->json([
            'level' => $data['level'],
            'paragraphs' => $paragraphs,
            'provider' => $this->ai->providerName(),
        ]);
    }

    /** POST /api/explain-word — fitur AI Explain This. */
    public function explain(Request $request): JsonResponse
    {
        $data = $request->validate([
            'term' => ['required', 'string', 'min:1', 'max:200'],
            'style' => ['required', 'string', Rule::in($this->ai->availableExplainStyles())],
            'context' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $paragraphs = $this->ai->explain($data['term'], $data['style'], $data['context'] ?? null);
        } catch (RuntimeException $e) {
            return $this->failure($e);
        }

        return response()->json([
            'style' => $data['style'],
            'paragraphs' => $paragraphs,
            'provider' => $this->ai->providerName(),
        ]);
    }

    /** GET /api/ai/health — cek cepat penyedia aktif dan kunci, tanpa memakai kuota. */
    public function health(): JsonResponse
    {
        return response()->json([
            'provider' => $this->ai->providerName(),
            'model' => $this->ai->model(),
            'configured' => $this->ai->isConfigured(),
        ]);
    }

    /**
     * 503 dipakai untuk kegagalan sisi penyedia (kuota, kunci, server LLM)
     * supaya aplikasi bisa membedakannya dari 422 kesalahan input pengguna.
     */
    private function failure(RuntimeException $e): JsonResponse
    {
        return response()->json(['message' => $e->getMessage()], 503);
    }
}
