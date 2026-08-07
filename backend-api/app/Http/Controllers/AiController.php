<?php

namespace App\Http\Controllers;

use App\Models\AiUsageLog;
use App\Services\Ai\AiAnswer;
use App\Services\AiTextService;
use App\Services\SystemSettings;
use App\Services\UsageRecorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use RuntimeException;
use Throwable;

class AiController extends Controller
{
    public function __construct(
        private readonly AiTextService $ai,
        private readonly UsageRecorder $usage,
    ) {}

    /** POST /api/simplify-text — level L2 sampai L5; L1 adalah teks asli, tanpa AI. */
    public function simplify(Request $request): JsonResponse
    {
        $data = $request->validate([
            // 8000 karakter ≈ sehalaman penuh hasil OCR; lebih dari itu latensinya tidak nyaman.
            'text' => ['required', 'string', 'min:10', 'max:8000'],
            'level' => ['required', 'string', Rule::in($this->ai->availableSimplifyLevels())],
            'language' => $this->languageRule(),
        ]);

        $language = $data['language'] ?? AiTextService::DEFAULT_LANGUAGE;
        $startedAt = hrtime(true);

        try {
            $answer = $this->ai->simplify($data['text'], $data['level'], $language);
        } catch (RuntimeException $e) {
            return $this->failure($e);
        }

        $this->record($request, AiUsageLog::FEATURE_SIMPLIFY, $data['level'], $language, $answer, $startedAt);

        return response()->json([
            'level' => $data['level'],
            'language' => $language,
            'paragraphs' => $answer->paragraphs,
            'provider' => $this->ai->providerName(),
            'footprint' => $answer->footprint->toArray(),
        ]);
    }

    /** POST /api/explain-word — fitur AI Explain This. */
    public function explain(Request $request): JsonResponse
    {
        $data = $request->validate([
            'term' => ['required', 'string', 'min:1', 'max:200'],
            'style' => ['required', 'string', Rule::in($this->ai->availableExplainStyles())],
            'context' => ['nullable', 'string', 'max:2000'],
            'language' => $this->languageRule(),
        ]);

        $language = $data['language'] ?? AiTextService::DEFAULT_LANGUAGE;
        $startedAt = hrtime(true);

        try {
            $answer = $this->ai->explain(
                $data['term'],
                $data['style'],
                $data['context'] ?? null,
                $language,
            );
        } catch (RuntimeException $e) {
            return $this->failure($e);
        }

        $this->record($request, AiUsageLog::FEATURE_EXPLAIN, $data['style'], $language, $answer, $startedAt);

        return response()->json([
            'style' => $data['style'],
            'language' => $language,
            'paragraphs' => $answer->paragraphs,
            'provider' => $this->ai->providerName(),
            'footprint' => $answer->footprint->toArray(),
        ]);
    }

    /** POST /api/correct-typo — perbaiki salah baca pada teks hasil scan OCR. */
    public function correctTypo(Request $request): JsonResponse
    {
        $data = $request->validate([
            'text' => ['required', 'string', 'min:5', 'max:8000'],
            'language' => $this->languageRule(),
        ]);

        $language = $data['language'] ?? AiTextService::DEFAULT_LANGUAGE;
        $startedAt = hrtime(true);

        try {
            $answer = $this->ai->correctTypo($data['text'], $language);
        } catch (RuntimeException $e) {
            return $this->failure($e);
        }

        $this->record($request, AiUsageLog::FEATURE_CORRECT_TYPO, null, $language, $answer, $startedAt);

        return response()->json([
            'language' => $language,
            'paragraphs' => $answer->paragraphs,
            'provider' => $this->ai->providerName(),
            'footprint' => $answer->footprint->toArray(),
        ]);
    }

    /**
     * GET /api/ai/health — periksa konfigurasi tanpa memakai kuota LLM.
     *
     * Berguna setelah deploy: cache yang tidak bisa ditulis maupun penjagaan
     * kunci yang belum aktif sama-sama tidak menimbulkan gejala dari sisi
     * pengguna. Yang dilaporkan hanya statusnya, bukan nilai kuncinya.
     */
    public function health(): JsonResponse
    {
        return response()->json([
            'provider' => $this->ai->providerName(),
            'model' => $this->ai->model(),
            'configured' => $this->ai->isConfigured(),
            'cache' => [
                'store' => config('cache.default'),
                'writable' => $this->cacheWritable(),
            ],
            'auth' => [
                'required' => (bool) config('services.ai.require_api_key'),
                // 'required' true + 'key_set' false = salah konfigurasi; endpoint
                // menolak semua permintaan sampai AI_API_KEY diisi.
                'key_set' => filled(config('services.ai.api_key')),
            ],
            /*
             * Bawaan preferensi untuk pengguna baru. Dibaca aplikasi hanya saat
             * penggunanya belum pernah mengatur sendiri, sehingga admin bisa
             * memperbaiki pilihan awal tanpa merilis ulang APK — dan tanpa
             * menimpa pilihan orang yang sudah menyesuaikannya.
             */
            'defaults' => app(SystemSettings::class)->get(
                SystemSettings::KEY_TYPOGRAPHY,
                config('defaults.typography'),
            ),
            'levels' => $this->ai->availableSimplifyLevels(),
            'styles' => $this->ai->availableExplainStyles(),
            'languages' => $this->ai->availableLanguages(),
            /*
             * Konstanta jejak karbon ikut dibuka supaya angka di aplikasi bisa
             * ditelusuri asalnya tanpa membaca kode. Penjelasan tiap konstanta
             * ada di config/footprint.php.
             */
            'footprint' => [
                'method' => (string) config('footprint.method'),
                'wh_per_input_token' => (float) config('footprint.wh_per_input_token'),
                'wh_per_output_token' => (float) config('footprint.wh_per_output_token'),
                'pue' => (float) config('footprint.pue'),
                'grid_intensity_g_per_kwh' => (float) config('footprint.grid_intensity_g_per_kwh'),
            ],
        ]);
    }

    /**
     * Catat pemakaian setelah jawabannya siap.
     *
     * Ditaruh di controller, bukan di AiTextService, supaya lapisan prompt tetap
     * tidak tahu-menahu soal HTTP — perangkat pengirim dan latensi yang dirasakan
     * pengguna hanya ada di sini.
     *
     * @param  float|int  $startedAt  Hasil hrtime(true) sebelum penyedia dipanggil.
     */
    private function record(
        Request $request,
        string $feature,
        ?string $variant,
        string $language,
        AiAnswer $answer,
        float|int $startedAt,
    ): void {
        $this->usage->record(
            $request,
            $feature,
            $variant,
            $language,
            $answer,
            $this->ai->providerName(),
            $this->ai->model(),
            (int) round((hrtime(true) - $startedAt) / 1_000_000),
        );
    }

    /**
     * Sengaja opsional: aplikasi versi lama belum mengirim field ini.
     *
     * @return array<int, mixed>
     */
    private function languageRule(): array
    {
        return ['sometimes', 'string', Rule::in($this->ai->availableLanguages())];
    }

    private function cacheWritable(): bool
    {
        try {
            Cache::put('ai:health', true, 60);

            return Cache::get('ai:health') === true;
        } catch (Throwable) {
            return false;
        }
    }

    /** 503 = kegagalan sisi penyedia LLM, supaya bisa dibedakan dari 422 salah input. */
    private function failure(RuntimeException $e): JsonResponse
    {
        return response()->json(['message' => $e->getMessage()], 503);
    }
}
