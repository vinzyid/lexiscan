<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Griphub Router — banyak model dari satu kunci, OpenAI-compatible.
 *
 * Sama seperti OpenRouter: satu endpoint `/v1/chat/completions`, autentikasi
 * lewat Bearer token, dan balasan bergaya OpenAI. Yang berbeda hanya alamat
 * dasarnya, sehingga lapisan HTTP-nya bisa dibuat tipis.
 *
 * MODEL DIPILIH LEWAT .env, bukan di sini. Daftar model Griphub bisa berubah
 * tanpa pemberitahuan, jadi menuliskan nama model di dalam kode berarti setiap
 * pergantian model menuntut deploy ulang.
 *
 * BEBERAPA MODEL BOLEH DITULIS DIPISAH KOMA, misalnya:
 *   GRIPHUB_MODEL=gemini-3.8-flash,deepseek-v4.1-flash
 *
 * Modelnya lalu dicoba berurutan: begitu yang pertama gagal — kuota habis,
 * server hulunya goyah, atau jawabannya tidak bisa dibaca — yang berikutnya
 * mengambil alih. Semuanya masih lewat satu kunci dan satu endpoint, jadi ini
 * cadangan di dalam Griphub sendiri, bukan penyedia lain.
 *
 * SYARAT MODEL: harus mendukung structured outputs / JSON mode. Kalau tidak,
 * jawabannya berupa teks bebas dan jaminan format paragraf hilang — aplikasi
 * mobile mengharapkan `{"paragraphs": [...]}`. Model yang mendukung biasanya
 * mencantumkan "json" atau "structured" di deskripsinya.
 */
class GriphubProvider implements AiProvider
{
    /**
     * Diperkuat dengan contoh konkret: model kecil jauh lebih patuh pada format
     * JSON kalau bentuk yang diminta diperlihatkan, bukan sekadar dijelaskan.
     * Griphub tidak punya responseSchema seperti Gemini, jadi prompt inilah
     * satu-satunya penjaga bentuk jawaban.
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
        return 'griphub';
    }

    public function isConfigured(): bool
    {
        return filled(config('services.griphub.key'));
    }

    /**
     * Model pertama pada daftar. Dipakai untuk log, kunci cache, dan laporan
     * pemakaian — sama seperti penyedia lain yang hanya punya satu model.
     */
    public function model(): string
    {
        return $this->models()[0];
    }

    /**
     * Semua model yang terdaftar, terurut sesuai urutan di .env.
     *
     * Nilai kosong dibuang, dan kalau .env tidak mengisi apa pun, dipakai
     * gemini-3.8-flash sebagai bawaan supaya konfigurasi lama tetap jalan.
     *
     * @return array<int, string>
     */
    private function models(): array
    {
        $configured = (string) config('services.griphub.model');

        $models = array_values(array_filter(
            array_map('trim', explode(',', $configured)),
            static fn (string $model): bool => $model !== '',
        ));

        return $models !== [] ? $models : ['gemini-3.8-flash'];
    }

    /**
     * Alamat lengkap endpoint chat.
     *
     * `base_url` di .env cukup diisi sampai `/v1` — akhiran `/chat/completions`
     * ditambahkan di sini supaya tidak salah tulis. Kalau base_url-nya sudah
     * memuat akhiran itu (salah tulis), tidak ditambahkan dua kali.
     */
    private function endpoint(): string
    {
        $base = rtrim((string) config('services.griphub.base_url'), '/');

        return str_ends_with($base, '/chat/completions')
            ? $base
            : $base . '/chat/completions';
    }

    public function paragraphsFor(string $prompt): LlmResult
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('GRIPHUB_API_KEY belum diisi di file .env backend.');
        }

        $models = $this->models();
        $last = null;

        foreach ($models as $index => $model) {
            try {
                return $this->ask($prompt, $model);
            } catch (RuntimeException $e) {
                $last = $e;

                $isLast = $index === count($models) - 1;

                /*
                 * Kunci salah dan masalah izin berlaku untuk semua model di
                 * bawah kunci yang sama, jadi mencoba model berikutnya hanya
                 * membuang waktu. Yang layak dicoba ulang adalah kegagalan yang
                 * melekat pada satu model: kuota, server hulunya, atau bentuk
                 * jawabannya.
                 */
                if ($this->isAccountWide($e)) {
                    throw $e;
                }

                Log::warning('Model Griphub gagal, mencoba berikutnya', [
                    'model' => $model,
                    'error' => $e->getMessage(),
                    'next' => $isLast ? null : $models[$index + 1],
                ]);
            }
        }

        throw $last;
    }

    /** Satu panggilan HTTP untuk satu model. */
    private function ask(string $prompt, string $model): LlmResult
    {
        $response = LlmHttp::client($this->name())
            ->withToken((string) config('services.griphub.key'))
            ->post($this->endpoint(), [
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
            ]);

        if ($response->failed()) {
            // Pesan asli dicatat supaya kuota habis vs kunci salah bisa dibedakan.
            Log::warning('Permintaan Griphub gagal', [
                'model' => $model,
                'status' => $response->status(),
                'body' => $response->json('error.message') ?? $response->body(),
            ]);

            throw $this->failure($response->status(), $response->json('error.message'), $model);
        }

        /*
         * Router bergaya ini kadang membalas 200 tapi isinya galat dari model
         * hulu — misalnya model sedang tidak tersedia. Tanpa pemeriksaan ini,
         * galatnya muncul sebagai "respons bukan JSON yang bisa dibaca" dan
         * sebab sebenarnya tertutup.
         */
        if (filled($upstream = $response->json('error.message'))) {
            Log::warning('Griphub membalas 200 dengan error', ['model' => $model, 'body' => $upstream]);

            // Galat hulu biasanya melekat pada satu model, jadi layak dicoba
            // model berikutnya alih-alih menyerah.
            throw new ProviderResponseException("Model {$model} menolak permintaan: {$upstream}");
        }

        $raw = $response->json('choices.0.message.content');

        if (blank($raw)) {
            // Model yang hanya mengembalikan penalaran tidak meninggalkan `content`
            // sama sekali; pengguna perlu tahu itu bukan sekadar "coba lagi".
            throw new ProviderResponseException(
                "Griphub tidak mengembalikan teks dari model \"{$model}\". Periksa apakah model itu mendukung mode JSON."
            );
        }

        return new LlmResult(
            ParagraphPayload::extract((string) $raw, 'Griphub'),
            TokenUsage::fromOpenAi($response->json('usage')),
        );
    }

    /**
     * Kegagalan yang berlaku untuk seluruh akun, bukan cuma satu model: kunci
     * salah, kunci ditolak, atau saldo habis. Model berikutnya akan gagal
     * dengan cara yang sama, jadi tidak dicoba.
     */
    private function isAccountWide(RuntimeException $e): bool
    {
        if ($e instanceof ProviderExhaustedException || $e instanceof ProviderResponseException) {
            return false;
        }

        return str_contains($e->getMessage(), 'GRIPHUB_API_KEY tidak valid')
            || str_contains($e->getMessage(), 'Kunci Griphub ditolak')
            || str_contains($e->getMessage(), 'Saldo Griphub tidak cukup');
    }

    /**
     * Kehabisan jatah dan kegagalan bentuk jawaban sama-sama layak dicoba ke
     * model berikutnya, jadi keduanya dilempar sebagai penanda yang dikenali
     * pemanggil. Kunci salah dan model tidak ada tetap dilempar apa adanya
     * supaya salah konfigurasi ketahuan, bukan tertutupi.
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
            $status === 401 => 'GRIPHUB_API_KEY tidak valid. Periksa kembali kunci dari griphubrouter.web.id.',
            $status === 402 => 'Saldo Griphub tidak cukup untuk model ini. Periksa saldo akun Anda.',
            $status === 404 => 'Model "' . $model . '" tidak ditemukan di Griphub. Periksa ejaan namanya.',
            $status === 429 => 'Jatah Griphub sedang habis. Tunggu sebentar lalu coba lagi.',
            $status >= 500 => 'Server Griphub sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke Griphub gagal.',
        };
    }
}
