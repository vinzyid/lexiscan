<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * APINEX — banyak model dari satu kunci, OpenAI-compatible.
 *
 * Bentuknya sengaja dibuat setara GriphubProvider, karena tujuannya memang
 * MEMBANDINGKAN keduanya: mana yang tulisannya lebih enak dibaca pembaca
 * disleksia. Karena itu seluruh perilaku penting Griphub dipertahankan di sini —
 * pemilihan model berurutan, pemeriksaan galat hulu, dan pengiriman potongan
 * teks panjang secara paralel — supaya perbandingan hasilnya adil: yang berbeda
 * hanya penyedianya, bukan cara memanggilnya.
 *
 * Model gratis diawali "free/". Beberapa model boleh ditulis dipisah koma di
 * APINEX_MODEL, mis. "free/gemini-3.8-flash,free/deepseek-v4.1-flash"; modelnya
 * dicoba berurutan begitu yang sebelumnya gagal.
 *
 * SYARAT MODEL: harus mendukung mode JSON / structured outputs. Kalau tidak,
 * jawabannya berupa teks bebas dan jaminan format paragraf hilang.
 */
class ApinexProvider implements AiProvider
{
    use SequentialBatching;

    /**
     * Porsi anggaran untuk model pertama; sisanya dibagi ke model berikutnya.
     * Alasan angkanya sama seperti di GriphubProvider.
     */
    private const FIRST_MODEL_SHARE = 0.85;

    /**
     * Penjaga bentuk jawaban. APINEX tidak punya responseSchema, jadi prompt
     * inilah satu-satunya yang memastikan keluarannya `{"paragraphs": [...]}`.
     */
    private const SYSTEM_PROMPT = <<<'PROMPT'
    Kamu membantu pembaca disleksia. Jawab SELALU dengan satu objek JSON saja,
    tanpa kalimat pembuka, tanpa penjelasan, dan tanpa blok markdown.

    Bentuk wajib:
    {"paragraphs": ["teks paragraf 1", "teks paragraf 2"]}

    Aturan:
    - Kunci harus "paragraphs" dan isinya array berisi string.
    - Setiap paragraf berupa teks biasa, bukan objek atau angka.
    - Jangan membungkus jawaban dengan ```json atau tanda kutip tambahan.
    PROMPT;

    public function name(): string
    {
        return 'apinex';
    }

    public function isConfigured(): bool
    {
        return filled(config('services.apinex.key'));
    }

    public function model(): string
    {
        return $this->models()[0];
    }

    /**
     * Semua model yang terdaftar, terurut sesuai urutan di .env.
     *
     * @return array<int, string>
     */
    private function models(): array
    {
        $configured = (string) config('services.apinex.model');

        $models = array_values(array_filter(
            array_map('trim', explode(',', $configured)),
            static fn (string $model): bool => $model !== '',
        ));

        return $models !== [] ? $models : ['free/gemini-3.8-flash'];
    }

    /**
     * Alamat lengkap endpoint chat.
     *
     * `base_url` cukup diisi sampai `/v1`; akhiran `/chat/completions`
     * ditambahkan di sini. Kalau sudah memuat akhiran itu, tidak ditambahkan dua
     * kali.
     */
    private function endpoint(): string
    {
        $base = rtrim((string) config('services.apinex.base_url'), '/');

        return str_ends_with($base, '/chat/completions')
            ? $base
            : $base.'/chat/completions';
    }

    public function paragraphsFor(string $prompt, ?float $timeoutSeconds = null): LlmResult
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('APINEX_API_KEY belum diisi di file .env backend.');
        }

        $models = $this->models();
        $last = null;

        /*
         * Anggaran tidak dibagi rata: model pertama yang biasanya menjawab dan
         * butuh waktu penuh; sisanya baru dibagi ke model cadangan. Sama seperti
         * GriphubProvider, supaya porsi waktunya sebanding.
         */
        $timeoutForModel = function (int $index) use ($timeoutSeconds, $models): ?float {
            if ($timeoutSeconds === null) {
                return null;
            }

            $rest = count($models) - 1;

            if ($rest === 0) {
                return $timeoutSeconds;
            }

            $reserved = $timeoutSeconds * (1 - self::FIRST_MODEL_SHARE);

            return $index === 0
                ? $timeoutSeconds * self::FIRST_MODEL_SHARE
                : $reserved / $rest;
        };

        foreach ($models as $index => $model) {
            try {
                return $this->ask($prompt, $model, $timeoutForModel($index));
            } catch (RuntimeException $e) {
                $last = $e;

                $isLast = $index === count($models) - 1;

                if ($this->isAccountWide($e)) {
                    throw $e;
                }

                Log::warning('Model APINEX gagal, mencoba berikutnya', [
                    'model' => $model,
                    'error' => $e->getMessage(),
                    'next' => $isLast ? null : $models[$index + 1],
                ]);
            }
        }

        throw $last;
    }

    /** Satu panggilan HTTP untuk satu model. */
    private function ask(string $prompt, string $model, ?float $timeoutSeconds = null): LlmResult
    {
        $response = LlmHttp::client($this->name(), $timeoutSeconds)
            ->withToken((string) config('services.apinex.key'))
            ->post($this->endpoint(), $this->payload($prompt, $model));

        return $this->parse($response, $model);
    }

    /**
     * Beberapa prompt sekaligus, dikirim BERSAMAAN lewat satu pool HTTP.
     *
     * Sama seperti versi Griphub: menyederhanakan dokumen panjang memecah teks
     * jadi beberapa potongan, dan mengirimnya berurutan membuat total waktunya
     * jumlah dari semuanya. Pool mengirim semuanya paralel.
     *
     * @param  array<int, string>  $prompts
     * @return array<int, LlmResult>
     */
    public function paragraphsForMany(array $prompts, ?float $timeoutSeconds = null): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('APINEX_API_KEY belum diisi di file .env backend.');
        }

        if (count($prompts) <= 1) {
            return array_map(fn (string $prompt): LlmResult => $this->paragraphsFor($prompt, $timeoutSeconds), $prompts);
        }

        $model = $this->model();
        $keyFor = static fn (int $index): string => "part{$index}";

        try {
            $responses = Http::pool(function (Pool $pool) use ($prompts, $model, $keyFor, $timeoutSeconds): void {
                foreach ($prompts as $index => $prompt) {
                    $pool->as($keyFor($index))
                        ->timeout((int) max(1, ceil($timeoutSeconds ?? ExecutionBudget::seconds())))
                        ->connectTimeout(10)
                        ->acceptJson()
                        ->withToken((string) config('services.apinex.key'))
                        ->post($this->endpoint(), $this->payload($prompt, $model));
                }
            });
        } catch (\Throwable $e) {
            Log::warning('Pool APINEX gagal', ['error' => $e->getMessage()]);

            throw new RuntimeException('Tidak bisa menghubungi server AI. Periksa koneksi internet lalu coba lagi.');
        }

        $results = [];

        foreach ($prompts as $index => $prompt) {
            $response = $responses[$keyFor($index)] ?? null;

            if (! $response instanceof Response) {
                $reason = $response instanceof \Throwable ? $response->getMessage() : 'respons tidak kembali dari pool';

                Log::warning('Batch APINEX gagal, mundur ke jalur berurutan', [
                    'model' => $model,
                    'part' => $index,
                    'error' => $reason,
                ]);

                /*
                 * Mundur ke jalur tunggal yang punya retry dan perpindahan
                 * model. Satu potongan gagal tidak boleh membuang potongan lain.
                 */
                return array_map(
                    fn (string $prompt): LlmResult => $this->paragraphsFor($prompt, $timeoutSeconds),
                    $prompts,
                );
            }

            $results[] = $this->parse($response, $model);
        }

        return $results;
    }

    /**
     * Bentuk body permintaan untuk jalur tunggal maupun pool.
     *
     * @return array<string, mixed>
     */
    private function payload(string $prompt, string $model): array
    {
        return [
            'model' => $model,
            'temperature' => 0.3,
            'messages' => [
                [
                    'role' => 'system',
                    'content' => self::SYSTEM_PROMPT,
                ],
                ['role' => 'user', 'content' => $prompt],
            ],
            'response_format' => [
                'type' => 'json_object',
            ],
        ];
    }

    /**
     * Ubah respons HTTP jadi LlmResult, atau lempar galat yang layak dibaca.
     */
    private function parse(Response $response, string $model): LlmResult
    {
        if ($response->failed()) {
            Log::warning('Permintaan APINEX gagal', [
                'model' => $model,
                'status' => $response->status(),
                'body' => $response->json('error.message') ?? $response->body(),
            ]);

            throw $this->failure($response->status(), $response->json('error.message'), $model);
        }

        // Router bergaya ini kadang membalas 200 tapi isinya galat dari model hulu.
        if (filled($upstream = $response->json('error.message'))) {
            Log::warning('APINEX membalas 200 dengan error', ['model' => $model, 'body' => $upstream]);

            throw new ProviderResponseException("Model {$model} menolak permintaan: {$upstream}");
        }

        $raw = $response->json('choices.0.message.content');

        if (blank($raw)) {
            throw new ProviderResponseException(
                "APINEX tidak mengembalikan teks dari model \"{$model}\". Periksa apakah model itu mendukung mode JSON."
            );
        }

        return new LlmResult(
            ParagraphPayload::extract((string) $raw, 'APINEX'),
            TokenUsage::fromOpenAi($response->json('usage')),
        );
    }

    /**
     * Kegagalan yang berlaku untuk seluruh akun: kunci salah/ditolak, atau saldo
     * habis. Model berikutnya akan gagal dengan cara yang sama, jadi tidak
     * dicoba.
     */
    private function isAccountWide(RuntimeException $e): bool
    {
        if ($e instanceof ProviderExhaustedException || $e instanceof ProviderResponseException) {
            return false;
        }

        return str_contains($e->getMessage(), 'APINEX_API_KEY tidak valid')
            || str_contains($e->getMessage(), 'Kunci APINEX ditolak')
            || str_contains($e->getMessage(), 'Saldo APINEX tidak cukup');
    }

    /**
     * Kehabisan jatah dan kegagalan bentuk jawaban layak dicoba ke model
     * berikutnya; kunci salah dan model tidak ada dilempar apa adanya supaya
     * salah konfigurasi ketahuan.
     */
    private function failure(int $status, ?string $detail, string $model): RuntimeException
    {
        $message = $this->humanError($status, $detail, $model);

        return in_array($status, [402, 429], true) || $status >= 500
            ? new ProviderExhaustedException($message)
            : new RuntimeException($message);
    }

    private function humanError(int $status, ?string $detail, string $model): string
    {
        return match (true) {
            $status === 401 => 'APINEX_API_KEY tidak valid. Periksa kembali kunci dari apinex.bond.',
            $status === 402 => 'Saldo APINEX tidak cukup untuk model ini. Pakai model berawalan "free/".',
            $status === 404 => 'Model "'.$model.'" tidak ditemukan di APINEX. Periksa ejaan namanya.',
            $status === 429 => 'Jatah APINEX sedang habis. Tunggu sebentar lalu coba lagi.',
            $status >= 500 => 'Server APINEX sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke APINEX gagal.',
        };
    }
}
