<?php

namespace App\Services;

use App\Services\Ai\AiAnswer;
use App\Services\Ai\AiProvider;
use App\Services\Ai\FallbackProvider;
use App\Services\Ai\FootprintEstimator;
use App\Services\Ai\LlmResult;
use App\Services\Ai\TokenUsage;
use App\Services\SystemSettings;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Prompt dan cache untuk fitur AI LexiScan. Semuanya terpusat di sini supaya
 * mengganti penyedia LLM tidak mengubah hasil maupun bentuk respons API.
 */
class AiTextService
{
    public const LANGUAGES = ['id', 'en'];

    public const DEFAULT_LANGUAGE = 'id';

    /**
     * Kemampuan membaca pembacanya, dikirim aplikasi bersama permintaan.
     * Menentukan seberapa pendek jawabannya. Harus sama persis dengan
     * App\Models\Reader::readingLevels() dan ReadingLevelId di aplikasi.
     */
    public const READING_LEVELS = ['belum', 'mengeja', 'lancar'];

    /**
     * Dipakai kalau permintaannya tidak menyebutkan kemampuan membaca — yaitu
     * aplikasi versi lama, dan pemakaian tanpa mendaftar.
     *
     * Sengaja yang paling longgar. Kalau tidak tahu siapa yang bertanya, memotong
     * jawaban terlalu pendek berisiko membuang fakta yang justru dibutuhkan;
     * kesalahan ke arah ini lebih mudah diperbaiki pembacanya sendiri.
     */
    public const DEFAULT_READING_LEVEL = 'lancar';

    /** Aturan bawaan; bisa ditimpa admin lewat dashboard, lihat SystemSettings. */

    /** Instruksi ditulis dalam bahasa sasaran; model mengikuti bahasa promptnya. */
    private const SIMPLIFY_RULES = [
        'id' => [
            'L2' => 'Pertahankan semua istilah teknis, tetapi pecah kalimat panjang menjadi kalimat pendek. Ini hanya sedikit lebih mudah dari aslinya.',
            'L3' => 'Gunakan bahasa sehari-hari yang santai. Istilah teknis boleh diganti padanan awam, tetapi fakta harus tetap akurat.',
            'L4' => 'Format Easy Read: sangat singkat dan padat. Boleh memakai tanda panah atau tanda sama dengan untuk menunjukkan hubungan.',
            /*
             * Dulu berbunyi "setara pemahaman anak sekolah dasar". Dibuang atas
             * masukan dosen PLB: menyebut jenjang atau usia untuk menggambarkan
             * kemampuan seseorang itu merendahkan, dan tidak menambah apa pun
             * bagi model — yang dibutuhkannya adalah panjang kalimat dan pilihan
             * kata, dan keduanya sudah dinyatakan langsung.
             */
            'L5' => 'Sesederhana mungkin. Gunakan kalimat sangat pendek dan kata yang paling umum dipakai sehari-hari.',
        ],
        'en' => [
            'L2' => 'Keep every technical term, but break long sentences into short ones. This should be only slightly easier than the original.',
            'L3' => 'Use relaxed, everyday language. Technical terms may be swapped for plain equivalents, but the facts must stay accurate.',
            'L4' => 'Easy Read format: very short and dense. Arrows or equals signs may be used to show relationships.',
            'L5' => 'As simple as possible. Use very short sentences and the most common everyday words.',
        ],
    ];

    /**
     * Gaya penjelasan fitur Tanya Lexi.
     *
     * Gaya 'sederhana' dulu bernama 'anak10' dan berbunyi "seperti berbicara
     * kepada anak berusia 10 tahun". Diganti atas masukan dosen PLB: pembacanya
     * bisa saja seusia itu, bisa juga jauh lebih tua, dan menyamakan kesulitan
     * membaca dengan usia anak-anak adalah bentuk diskriminasi. Yang sebenarnya
     * diminta dari model tidak pernah "berbicaralah kepada anak", melainkan
     * "pakailah kata yang paling sederhana" — dan itu yang sekarang ditulis.
     */
    private const EXPLAIN_STYLES = [
        'id' => [
            'sederhana' => 'Jelaskan dengan kata-kata yang paling sederhana dan hangat. Hindari istilah sulit; kalau terpaksa memakainya, jelaskan artinya sekalian.',
            'analogi' => 'Jelaskan memakai satu analogi atau perumpamaan yang mudah dibayangkan, lalu kaitkan kembali ke konsep aslinya.',
            'nyata' => 'Jelaskan lewat contoh konkret dari kehidupan sehari-hari yang kemungkinan pernah dialami pembaca.',
        ],
        'en' => [
            'sederhana' => 'Explain it with the simplest, warmest words. Avoid difficult terms; if one is unavoidable, explain what it means as well.',
            'analogi' => 'Explain it with a single analogy that is easy to picture, then tie it back to the original concept.',
            'nyata' => 'Explain it through a concrete example from everyday life that the reader has probably experienced.',
        ],
    ];

    /**
     * Batas panjang jawaban Tanya Lexi menurut kemampuan membaca pembacanya.
     *
     * Ini inti masukan dosen PLB: penjelasan tertulis yang panjang justru
     * menyulitkan dan membingungkan, sehingga yang paling membutuhkan bantuan
     * malah paling dirugikan oleh jawaban yang bertele-tele. Sebelumnya semua
     * orang mendapat batas yang sama, yaitu tiga paragraf.
     *
     * Batasnya dinyatakan dalam kalimat dan kata, bukan "singkat saja", karena
     * model menuruti angka jauh lebih patuh daripada kata sifat.
     */
    private const EXPLAIN_LENGTH_RULES = [
        'id' => [
            'belum' => 'Jawab dengan SATU paragraf saja, maksimal dua kalimat. Satu kalimat maksimal sepuluh kata.',
            'mengeja' => 'Jawab dengan SATU paragraf saja, maksimal tiga kalimat pendek.',
            'lancar' => 'Jawab maksimal dua paragraf pendek.',
        ],
        'en' => [
            'belum' => 'Answer with ONE paragraph only, at most two sentences. Each sentence at most ten words.',
            'mengeja' => 'Answer with ONE paragraph only, at most three short sentences.',
            'lancar' => 'Answer with at most two short paragraphs.',
        ],
    ];

    /**
     * Batas panjang hasil penyederhanaan.
     *
     * Dinyatakan per paragraf, bukan untuk keseluruhan teks seperti pada
     * EXPLAIN_LENGTH_RULES: jumlah paragrafnya sudah terikat teks aslinya, jadi
     * yang bisa diatur di sini hanya kepadatan tiap paragraf.
     */
    private const SIMPLIFY_LENGTH_RULES = [
        'id' => [
            'belum' => 'Satu paragraf maksimal dua kalimat, dan satu kalimat maksimal sepuluh kata.',
            'mengeja' => 'Satu paragraf maksimal dua kalimat pendek.',
            'lancar' => 'Satu paragraf maksimal tiga kalimat.',
        ],
        'en' => [
            'belum' => 'At most two sentences per paragraph, and at most ten words per sentence.',
            'mengeja' => 'At most two short sentences per paragraph.',
            'lancar' => 'At most three sentences per paragraph.',
        ],
    ];

    private readonly FootprintEstimator $footprint;

    private readonly SystemSettings $settings;

    /**
     * Estimator dan parameter sistem boleh dikosongkan supaya pemanggil yang
     * hanya peduli teks — termasuk test lama — tidak perlu tahu soal
     * perhitungan jejak karbon maupun aturan yang disunting admin.
     */
    public function __construct(
        private readonly AiProvider $provider,
        ?FootprintEstimator $footprint = null,
        ?SystemSettings $settings = null,
    ) {
        $this->footprint = $footprint ?? new FootprintEstimator;
        // Lewat container supaya memo per-permintaannya dipakai bersama, bukan
        // dibaca ulang oleh setiap pemanggil.
        $this->settings = $settings ?? app(SystemSettings::class);
    }

    /**
     * Aturan penyederhanaan yang berlaku: bawaan di kode, ditimpa suntingan
     * admin kalau ada.
     *
     * @return array<string, array<string, string>>
     */
    public function simplifyRules(): array
    {
        return $this->onlyKnownKeys(
            $this->settings->get(SystemSettings::KEY_SIMPLIFY_RULES, self::SIMPLIFY_RULES),
            self::SIMPLIFY_RULES,
        );
    }

    /** @return array<string, array<string, string>> */
    public function explainStyles(): array
    {
        return $this->onlyKnownKeys(
            $this->settings->get(SystemSettings::KEY_EXPLAIN_STYLES, self::EXPLAIN_STYLES),
            self::EXPLAIN_STYLES,
        );
    }

    /**
     * Buang level maupun gaya yang tidak lagi dikenal kode ini.
     *
     * Suntingan admin tersimpan permanen di tabel `settings` dan digabung
     * dengan bawaan lewat array_replace_recursive, sehingga kunci yang sudah
     * dihapus dari kode akan hidup terus di hasil gabungannya. Itu bukan
     * masalah teoretis: gaya 'anak10' pernah tersimpan di sana, dan tanpa
     * saringan ini ia tetap muncul sebagai kolom yang bisa disunting di
     * dashboard — padahal API sudah menolaknya, karena daftar yang divalidasi
     * diambil dari konstanta, bukan dari hasil gabungan ini.
     *
     * @param  array<string, array<string, string>>  $merged
     * @param  array<string, array<string, string>>  $known
     * @return array<string, array<string, string>>
     */
    private function onlyKnownKeys(array $merged, array $known): array
    {
        foreach ($merged as $language => $entries) {
            $merged[$language] = array_intersect_key($entries, $known[$language] ?? []);
        }

        return $merged;
    }

    public function isConfigured(): bool
    {
        return $this->provider->isConfigured();
    }

    public function providerName(): string
    {
        return $this->provider->name();
    }

    public function model(): string
    {
        return $this->provider->model();
    }

    /** Nama penyedia cadangan, atau null kalau tidak ada yang dipasang. */
    public function fallbackName(): ?string
    {
        return $this->provider instanceof FallbackProvider
            ? $this->provider->fallbackName()
            : null;
    }

    /** @return array<int, string> */
    public function availableSimplifyLevels(): array
    {
        return array_keys(self::SIMPLIFY_RULES[self::DEFAULT_LANGUAGE]);
    }

    /** @return array<int, string> */
    public function availableExplainStyles(): array
    {
        return array_keys(self::EXPLAIN_STYLES[self::DEFAULT_LANGUAGE]);
    }

    /** @return array<int, string> */
    public function availableLanguages(): array
    {
        return self::LANGUAGES;
    }

    /** @return array<int, string> */
    public function availableReadingLevels(): array
    {
        return self::READING_LEVELS;
    }

    /** Paragraf hasil penyederhanaan, beserta taksiran jejak karbonnya. */
    public function simplify(
        string $text,
        string $level,
        string $language = self::DEFAULT_LANGUAGE,
        string $readingLevel = self::DEFAULT_READING_LEVEL,
    ): AiAnswer {
        $language = $this->normalizeLanguage($language);
        $readingLevel = $this->normalizeReadingLevel($readingLevel);

        $rule = $this->simplifyRules()[$language][$level]
            ?? throw new RuntimeException("Level penyederhanaan tidak dikenal: {$level}");

        $lengthRule = self::SIMPLIFY_LENGTH_RULES[$language][$readingLevel];

        $prompt = $language === 'en'
            ? <<<PROMPT
            You are helping a dyslexic reader understand a school text written in English.

            Rewrite the text below following this rule: {$rule}

            Hard requirements:
            - Answer in English.
            - Do not add information that is not in the original text.
            - Do not drop important facts.
            - Keep the number of paragraphs as close to the original as possible.
            - {$lengthRule}

            Original text:
            {$text}
            PROMPT
            : <<<PROMPT
            Kamu membantu pembaca disleksia memahami teks pelajaran berbahasa Indonesia.

            Tulis ulang teks di bawah dengan aturan: {$rule}

            Ketentuan wajib:
            - Jawab dalam bahasa Indonesia.
            - Jangan menambah informasi yang tidak ada di teks asli.
            - Jangan menghilangkan fakta penting.
            - Pertahankan jumlah paragraf sedekat mungkin dengan teks asli.
            - {$lengthRule}

            Teks asli:
            {$text}
            PROMPT;

        return $this->remember("simplify:{$language}:{$level}:{$readingLevel}:" . md5($text), $prompt);
    }

    /** Paragraf penjelasan, beserta taksiran jejak karbonnya. */
    public function explain(
        string $term,
        string $style,
        ?string $context = null,
        string $language = self::DEFAULT_LANGUAGE,
        string $readingLevel = self::DEFAULT_READING_LEVEL,
    ): AiAnswer {
        $language = $this->normalizeLanguage($language);
        $readingLevel = $this->normalizeReadingLevel($readingLevel);

        $styleRule = $this->explainStyles()[$language][$style]
            ?? throw new RuntimeException("Gaya penjelasan tidak dikenal: {$style}");

        $lengthRule = self::EXPLAIN_LENGTH_RULES[$language][$readingLevel];

        if ($language === 'en') {
            $contextBlock = filled($context)
                ? "The sentence the word appears in, for context:\n{$context}"
                : 'No additional context.';

            $prompt = <<<PROMPT
            You are Lexi, a friendly reading companion for dyslexic readers.

            Explain "{$term}" following this rule: {$styleRule}

            Hard requirements:
            - Answer in English.
            - {$lengthRule}
            - Short sentences; avoid technical terms you do not explain.
            - The explanation must be accurate — never invent facts.
            - Focus only on the main concept or term.
            - No emoji and no decorative symbols: this answer is read aloud.
            - Never describe the reader by age or school grade.

            {$contextBlock}
            PROMPT;
        } else {
            $contextBlock = filled($context)
                ? "Kalimat tempat kata itu muncul, sebagai konteks:\n{$context}"
                : 'Tidak ada konteks tambahan.';

            $prompt = <<<PROMPT
            Kamu Lexi, pendamping baca yang ramah untuk pembaca disleksia.

            Jelaskan "{$term}" dengan aturan: {$styleRule}

            Ketentuan wajib:
            - Jawab dalam bahasa Indonesia.
            - {$lengthRule}
            - Kalimat pendek, hindari istilah teknis yang tidak dijelaskan.
            - Penjelasan harus akurat, jangan mengarang fakta.
            - Fokus jelaskan konsep atau istilah utamanya saja.
            - Tanpa emoji dan tanpa simbol hiasan: jawaban ini akan dibacakan suara.
            - Jangan pernah menyebut usia atau jenjang sekolah pembacanya.

            {$contextBlock}
            PROMPT;
        }

        return $this->remember(
            "explain:{$language}:{$style}:{$readingLevel}:" . md5($term . '|' . $context),
            $prompt,
        );
    }

    /** Paragraf hasil OCR yang sudah dikoreksi, beserta taksiran jejak karbonnya. */
    public function correctTypo(string $text, string $language = self::DEFAULT_LANGUAGE): AiAnswer
    {
        $language = $this->normalizeLanguage($language);

        $prompt = $language === 'en'
            ? <<<PROMPT
            The text below came out of an OCR scan of an English book or document.
            Because of photo or lens quality, some characters are misread
            (for example the digit '1' read as the letter 'l', the letter 'O' as the digit '0', clipped letters, or missing spaces).

            Your task:
            - Fix every typo and misread character.
            - Restore correct English spelling and punctuation.
            - Keep the same number of paragraphs and the same information — do NOT summarise or simplify!
            - Reply with the corrected text only, with no preamble or closing remarks.

            Original scanned text:
            {$text}
            PROMPT
            : <<<PROMPT
            Teks di bawah ini adalah hasil scan OCR dari buku atau dokumen bahasa Indonesia.
            Karena kualitas foto atau lensa, terkadang ada karakter yang terbaca salah
            (contoh: angka '1' menjadi huruf 'l', huruf 'O' menjadi angka '0', huruf terpotong, atau spasi hilang).

            Tugasmu adalah:
            - Memperbaiki semua saltik (typo) dan kesalahan baca tersebut.
            - Menyusun kembali ejaan agar sesuai EYD bahasa Indonesia yang baik dan benar.
            - Mempertahankan jumlah paragraf dan isi informasinya, JANGAN merangkum atau menyederhanakan!
            - Jawab langsung dengan teks yang sudah diperbaiki, tanpa kata pembuka atau penutup.

            Teks asli hasil scan:
            {$text}
            PROMPT;

        // Tidak di-cache: foto ulang dari sudut berbeda menghasilkan teks yang
        // mirip tapi tidak identik, jadi cache hampir tidak pernah kena.
        return $this->spend($prompt);
    }

    /** Jaring pengaman untuk pemanggil internal; validasi sebenarnya di controller. */
    private function normalizeLanguage(string $language): string
    {
        return in_array($language, self::LANGUAGES, true) ? $language : self::DEFAULT_LANGUAGE;
    }

    private function normalizeReadingLevel(string $readingLevel): string
    {
        return in_array($readingLevel, self::READING_LEVELS, true)
            ? $readingLevel
            : self::DEFAULT_READING_LEVEL;
    }

    /**
     * Ambil dari cache kalau ada, kalau tidak tanya penyedia lalu simpan.
     *
     * Cache di sini penghematan kuota sekaligus energi, tapi bukan sumber
     * kebenaran: store yang mati tidak boleh ikut mematikan fitur AI, jadi
     * kegagalannya dicatat lalu permintaan tetap diteruskan ke penyedia.
     */
    private function remember(string $suffix, string $prompt): AiAnswer
    {
        /*
         * Sidik jari promptnya ikut jadi kunci.
         *
         * Simpanannya permanen, sementara $suffix hanya memuat teks MASUKAN —
         * bukan instruksi yang membungkusnya. Tanpa sidik jari ini, aturan yang
         * baru disunting admin dari dashboard tidak akan pernah menggantikan
         * hasil lama: kuncinya sama persis, jadi jawaban dari aturan sebelumnya
         * disajikan selamanya. Dulu masalah ini hilang sendiri dalam sehari
         * karena ada TTL; sekarang tidak.
         *
         * Dihitung dari prompt yang benar-benar dikirim, jadi perubahan apa pun
         * — aturan per level, badan prompt, maupun ketentuan wajibnya — ikut
         * tertangkap tanpa ada yang perlu menaikkan nomor versi dengan tangan.
         */
        $fingerprint = substr(md5($prompt), 0, 12);

        // Provider dan model ikut supaya hasil lama tidak terpakai setelah
        // AI_PROVIDER diganti.
        $key = "ai:{$fingerprint}:{$this->provider->name()}:{$this->provider->model()}:{$suffix}";

        try {
            if (($cached = $this->fromCache(Cache::get($key))) !== null) {
                return $cached;
            }
        } catch (Throwable $e) {
            $this->warnCacheUnavailable('baca', $e);
        }

        $result = $this->ask($prompt);

        try {
            /*
             * Jumlah token ikut disimpan supaya cache hit nanti bisa melaporkan
             * berapa besar emisi yang dihindarinya. Tanpa ini, penghematan
             * hanya bisa dihitung sebagai "entah berapa".
             *
             * TTL null menyimpan selamanya — itu bawaannya, lihat alasannya di
             * config/services.php.
             */
            Cache::put($key, [
                'paragraphs' => $result->paragraphs,
                'tokens' => $result->tokens->toArray(),
            ], config('services.ai.cache_ttl'));
        } catch (Throwable $e) {
            $this->warnCacheUnavailable('tulis', $e);
        }

        return new AiAnswer($result->paragraphs, $this->footprint->forUsage($result->tokens));
    }

    /**
     * Membaca entri cache menjadi jawaban siap pakai, atau null kalau entrinya
     * tidak ada / tidak terpakai.
     *
     * @param  mixed  $hit
     */
    private function fromCache($hit): ?AiAnswer
    {
        if (! is_array($hit) || $hit === []) {
            return null;
        }

        /*
         * Format lama menyimpan daftar paragraf polos, tanpa catatan token.
         * Entri seperti itu masih berlaku sampai TTL-nya habis, jadi tetap
         * dipakai — hanya penghematannya yang tidak bisa ditaksir.
         */
        if (array_is_list($hit)) {
            return new AiAnswer($hit, $this->footprint->forCacheHit(TokenUsage::unknown()));
        }

        $paragraphs = $hit['paragraphs'] ?? null;

        if (! is_array($paragraphs) || $paragraphs === []) {
            return null;
        }

        return new AiAnswer(
            array_values($paragraphs),
            $this->footprint->forCacheHit(TokenUsage::fromArray($hit['tokens'] ?? null)),
        );
    }

    /** Panggilan yang benar-benar memakai kuota dan energi, tanpa perantara cache. */
    private function spend(string $prompt): AiAnswer
    {
        $result = $this->ask($prompt);

        return new AiAnswer($result->paragraphs, $this->footprint->forUsage($result->tokens));
    }

    /**
     * Satu-satunya tempat penyedia dipanggil, supaya kegagalan jaringan
     * diterjemahkan jadi pesan yang layak dibaca pengguna di semua fitur.
     */
    private function ask(string $prompt): LlmResult
    {
        try {
            return $this->provider->paragraphsFor($prompt);
        } catch (ConnectionException $e) {
            // Gagal sebelum ada respons HTTP: internet mati, timeout, atau
            // sertifikat CA belum terpasang di PHP.
            Log::warning('Tidak bisa menghubungi penyedia AI', [
                'provider' => $this->provider->name(),
                'error' => $e->getMessage(),
            ]);

            throw new RuntimeException(
                match (true) {
                    str_contains($e->getMessage(), 'certificate') => 'PHP tidak punya sertifikat CA, jadi koneksi HTTPS ditolak. Atur curl.cainfo di php.ini.',
                    str_contains($e->getMessage(), 'Operation timed out'),
                    str_contains($e->getMessage(), 'timed out') => 'Server AI tidak merespons dalam ' . config('services.ai.timeout') . ' detik. Coba teks yang lebih pendek.',
                    default => 'Tidak bisa menghubungi server AI. Periksa koneksi internet lalu coba lagi.',
                },
                previous: $e,
            );
        }
    }

    private function warnCacheUnavailable(string $operation, Throwable $e): void
    {
        Log::warning("Cache AI tidak bisa di-{$operation}, permintaan diteruskan tanpa cache", [
            'store' => config('cache.default'),
            'error' => $e->getMessage(),
        ]);
    }
}
