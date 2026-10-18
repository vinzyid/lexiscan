<?php

namespace App\Services\Ai;

use Illuminate\Http\Client\Pool;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
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
    /*
     * Batch BERURUTAN dari trait dipakai untuk `paragraphsForMany` cadangan,
     * tapi method-nya ditimpa di bawah dengan versi paralel. Trait tetap
     * dipasang supaya kalau penimpaan itu dihapus, kelas ini masih sah.
     */
    use SequentialBatching;

    /**
     * Porsi anggaran untuk model pertama; sisanya dibagi ke model berikutnya.
     *
     * 0,85 berarti dengan dua model, model pertama dapat 85% dan cadangannya
     * 15% — cukup untuk satu jawaban normal di model utama, tapi tetap
     * menyisakan waktu nyata bagi model cadangan kalau yang pertama gagal.
     * Porsinya sengaja besar: pembagian berlapis (potongan → penyedia
     * utama/cadangan → model) memangkas waktu berkali-kali, dan model pertama
     * yang sehat jangan sampai kehabisan jatah hanya karena cadangan yang
     * jarang terpakai menahan terlalu banyak.
     */
    private const FIRST_MODEL_SHARE = 0.85;

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
            : $base.'/chat/completions';
    }

    public function paragraphsFor(string $prompt, ?float $timeoutSeconds = null): LlmResult
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('GRIPHUB_API_KEY belum diisi di file .env backend.');
        }

        $models = $this->models();
        $last = null;

        /*
         * Anggaran TIDAK dibagi rata. Model pertama yang biasanya menjawab, dan
         * ia butuh waktu penuh untuk halaman panjang; membaginya rata (mis. 8
         * detik masing-masing kalau ada dua model dalam anggaran 16 detik)
         * membuat model yang sehat pun kehabisan waktu sebelum selesai. Jadi
         * model pertama diberi porsi besar, dan sisanya baru dibagi ke model
         * berikutnya — sama seperti FallbackProvider memperlakukan cadangannya.
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
    private function ask(string $prompt, string $model, ?float $timeoutSeconds = null): LlmResult
    {
        $response = LlmHttp::client($this->name(), $timeoutSeconds)
            ->withToken((string) config('services.griphub.key'))
            ->post($this->endpoint(), $this->payload($prompt, $model));

        return $this->parse($response, $model);
    }

    /**
     * Beberapa prompt sekaligus, dikirim BERSAMAAN lewat satu pool HTTP.
     *
     * INI INTI PERCEPATANNYA. Menyederhanakan dokumen panjang memecah teks jadi
     * beberapa potongan, dan mengirimnya satu per satu membuat total waktunya
     * jumlah dari semuanya. Pool mengirim semuanya paralel, jadi tiga potongan
     * selesai dalam waktu satu potongan — bukan tiga kali.
     *
     * KENAPA DI GRIPHUB SAJA. Provider inilah yang dipakai produksi, dan
     * endpoint-nya OpenAI-compatible sehingga bentuk body-nya bisa disusun
     * ulang di sini. Provider lain tetap memakai jalur berurutan (trait), jadi
     * perubahan ini tidak menyentuh perilaku mereka sama sekali.
     *
     * ANGGARAN WAKTU: `$timeoutSeconds` berlaku untuk SELURUH pool, bukan per
     * permintaan — persis seperti versi berurutannya yang juga menghabiskan satu
     * deadline bersama. Tiap permintaan di dalam pool memakai nilai yang sama,
     * karena pool dianggap selesai saat yang paling lambat selesai.
     *
     * @param  array<int, string>  $prompts
     * @return array<int, LlmResult>
     */
    public function paragraphsForMany(array $prompts, ?float $timeoutSeconds = null): array
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('GRIPHUB_API_KEY belum diisi di file .env backend.');
        }

        // Satu prompt tidak perlu pool; jalur tunggal lebih sederhana dan sudah
        // punya seluruh penanganan model cadangan.
        if (count($prompts) <= 1) {
            return array_map(fn (string $prompt): LlmResult => $this->paragraphsFor($prompt, $timeoutSeconds), $prompts);
        }

        /*
         * Model yang dipakai batch = model PERTAMA pada daftar, sama seperti
         * jalur tunggal. Model cadangan tidak dilibatkan di sini: menjalankan
         * beberapa model sekaligus untuk satu batch berarti menggandakan kuota
         * dan menyulitkan penelusuran. Kegagalan batch ditangani dengan
         * mengulang seluruh batch pada jalur tunggal sekali — lihat di bawah.
         */
        $model = $this->model();

        /*
         * Kunci pool sengaja BERTEKSTUKS ("part0", "part1"), bukan angka.
         * Laravel menormalkan kunci pool yang berupa string angka, sehingga
         * "0" tidak selalu bisa ditemukan kembali sebagai "0" — dan akibatnya
         * respons pertama hilang tanpa jejak. Prefiks teks menghindari itu.
         */
        $keyFor = static fn (int $index): string => "part{$index}";

        try {
            $responses = Http::pool(function (Pool $pool) use ($prompts, $model, $keyFor, $timeoutSeconds): void {
                foreach ($prompts as $index => $prompt) {
                    $pool->as($keyFor($index))
                        /*
                         * Tiap permintaan diberi anggaran penuh, bukan dibagi
                         * rata: pool dianggap selesai saat yang PALING LAMBAT
                         * selesai, jadi membagi rata hanya memangkas setiap
                         * potongan tanpa mempercepat batch secara keseluruhan.
                         */
                        ->timeout((int) max(1, ceil($timeoutSeconds ?? ExecutionBudget::seconds())))
                        ->connectTimeout(10)
                        ->acceptJson()
                        ->withToken((string) config('services.griphub.key'))
                        ->post($this->endpoint(), $this->payload($prompt, $model));
                }
            });
        } catch (\Throwable $e) {
            /*
             * Kegagalan pool itu sendiri (bukan satu permintaan di dalamnya):
             * koneksi putus sebelum satu pun terkirim, atau pool tidak bisa
             * dibentuk. Diterjemahkan sama seperti jalur tunggal.
             */
            Log::warning('Pool Griphub gagal', ['error' => $e->getMessage()]);

            throw new RuntimeException('Tidak bisa menghubungi server AI. Periksa koneksi internet lalu coba lagi.');
        }

        $results = [];

        foreach ($prompts as $index => $prompt) {
            $response = $responses[$keyFor($index)] ?? null;

            /*
             * Entri pool bisa berupa exception kalau permintaan itu timeout atau
             * koneksinya putus, dan `null` kalau kuncinya tidak kembali. Keduanya
             * diperlakukan sama: batch gagal, dan pemanggil boleh mencoba ulang.
             */
            if (! $response instanceof Response) {
                $reason = $response instanceof \Throwable ? $response->getMessage() : 'respons tidak kembali dari pool';

                Log::warning('Batch Griphub gagal, mundur ke jalur berurutan', [
                    'model' => $model,
                    'part' => $index,
                    'error' => $reason,
                ]);

                /*
                 * MUNDUR KE JALUR TUNGGAL, bukan gagal begitu saja.
                 *
                 * Jalur tunggal sudah punya seluruh penanganan yang tidak dimiliki
                 * pool: retry pada galat sementara, dan perpindahan ke model
                 * cadangan. Menggagalkan batch hanya karena satu potongan gagal
                 * berarti membuang potongan lain yang mungkin baik-baik saja —
                 * dan pengguna melihat kegagalan yang tidak perlu. Jadi seluruh
                 * batch dikerjakan ulang lewat jalur yang lebih tangguh.
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
     * Bentuk body permintaan yang sama untuk jalur tunggal maupun pool.
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
     *
     * Dipakai bersama jalur tunggal dan jalur pool supaya pemeriksaan galatnya
     * tidak berbeda diam-diam antara dua jalur itu.
     */
    private function parse(Response $response, string $model): LlmResult
    {
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
            $status === 404 => 'Model "'.$model.'" tidak ditemukan di Griphub. Periksa ejaan namanya.',
            $status === 429 => 'Jatah Griphub sedang habis. Tunggu sebentar lalu coba lagi.',
            $status >= 500 => 'Server Griphub sedang bermasalah. Coba beberapa saat lagi.',
            default => $detail ?? 'Permintaan ke Griphub gagal.',
        };
    }
}
