<?php

namespace App\Services;

use App\Services\Ai\AiProvider;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Prompt engineering untuk dua fitur AI LexiScan.
 *
 * Prompt dan caching tinggal di sini, terlepas dari penyedia mana yang aktif,
 * supaya berganti dari Gemini ke Grok tidak mengubah kualitas hasil maupun
 * bentuk respons API. Kunci API hanya hidup di sisi server — aplikasi mobile
 * tidak pernah memegangnya, sesuai peran backend sebagai gateway.
 */
class AiTextService
{
    public const LANGUAGES = ['id', 'en'];

    public const DEFAULT_LANGUAGE = 'id';

    /**
     * Instruksi ditulis dalam bahasa sasaran, bukan diterjemahkan di ujung:
     * model cenderung menjawab mengikuti bahasa instruksinya.
     */
    private const SIMPLIFY_RULES = [
        'id' => [
            'L2' => 'Pertahankan semua istilah teknis, tetapi pecah kalimat panjang menjadi kalimat pendek. Ini hanya sedikit lebih mudah dari aslinya.',
            'L3' => 'Gunakan bahasa sehari-hari yang santai. Istilah teknis boleh diganti padanan awam, tetapi fakta harus tetap akurat.',
            'L4' => 'Format Easy Read: sangat singkat dan padat. Boleh memakai tanda panah atau tanda sama dengan untuk menunjukkan hubungan.',
            'L5' => 'Sesederhana mungkin, setara pemahaman anak sekolah dasar. Gunakan kalimat sangat pendek dan kata yang paling umum.',
        ],
        'en' => [
            'L2' => 'Keep every technical term, but break long sentences into short ones. This should be only slightly easier than the original.',
            'L3' => 'Use relaxed, everyday language. Technical terms may be swapped for plain equivalents, but the facts must stay accurate.',
            'L4' => 'Easy Read format: very short and dense. Arrows or equals signs may be used to show relationships.',
            'L5' => 'As simple as possible, at primary-school reading level. Use very short sentences and the most common words.',
        ],
    ];

    /** Gaya penjelasan pada fitur Tanya Lexi. */
    private const EXPLAIN_STYLES = [
        'id' => [
            'anak10' => 'Jelaskan seperti sedang berbicara kepada anak berusia 10 tahun. Ramah dan sederhana.',
            'analogi' => 'Jelaskan memakai satu analogi atau perumpamaan yang mudah dibayangkan, lalu kaitkan kembali ke konsep aslinya.',
            'nyata' => 'Jelaskan lewat contoh konkret dari kehidupan sehari-hari yang kemungkinan pernah dialami pembaca.',
        ],
        'en' => [
            'anak10' => 'Explain it as if you were talking to a 10-year-old. Warm and simple.',
            'analogi' => 'Explain it with a single analogy that is easy to picture, then tie it back to the original concept.',
            'nyata' => 'Explain it through a concrete example from everyday life that the reader has probably experienced.',
        ],
    ];

    public function __construct(private readonly AiProvider $provider) {}

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

    /**
     * Sederhanakan teks ke level tertentu.
     *
     * @return array<int, string> Paragraf hasil penyederhanaan.
     */
    public function simplify(string $text, string $level, string $language = self::DEFAULT_LANGUAGE): array
    {
        $language = $this->normalizeLanguage($language);

        $rule = self::SIMPLIFY_RULES[$language][$level]
            ?? throw new RuntimeException("Level penyederhanaan tidak dikenal: {$level}");

        $prompt = $language === 'en'
            ? <<<PROMPT
            You are helping a dyslexic reader understand a school text written in English.

            Rewrite the text below following this rule: {$rule}

            Hard requirements:
            - Answer in English.
            - Do not add information that is not in the original text.
            - Do not drop important facts.
            - Keep the number of paragraphs as close to the original as possible.
            - At most three sentences per paragraph.

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
            - Satu paragraf maksimal tiga kalimat.

            Teks asli:
            {$text}
            PROMPT;

        return $this->remember("simplify:{$language}:{$level}:" . md5($text), $prompt);
    }

    /**
     * Jelaskan sebuah kata atau potongan teks dengan gaya tertentu.
     *
     * @return array<int, string> Paragraf penjelasan.
     */
    public function explain(
        string $term,
        string $style,
        ?string $context = null,
        string $language = self::DEFAULT_LANGUAGE,
    ): array {
        $language = $this->normalizeLanguage($language);

        $styleRule = self::EXPLAIN_STYLES[$language][$style]
            ?? throw new RuntimeException("Gaya penjelasan tidak dikenal: {$style}");

        if ($language === 'en') {
            $contextBlock = filled($context)
                ? "The sentence the word appears in, for context:\n{$context}"
                : 'No additional context.';

            $prompt = <<<PROMPT
            You are Lexi, a friendly reading companion for dyslexic readers.

            Explain "{$term}" following this rule: {$styleRule}

            Hard requirements:
            - Answer in English.
            - At most three short paragraphs.
            - Short sentences; avoid technical terms you do not explain.
            - The explanation must be accurate — never invent facts.
            - Focus only on the main concept or term.

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
            - Maksimal tiga paragraf pendek.
            - Kalimat pendek, hindari istilah teknis yang tidak dijelaskan.
            - Penjelasan harus akurat, jangan mengarang fakta.
            - Fokus jelaskan konsep atau istilah utamanya saja.

            {$contextBlock}
            PROMPT;
        }

        return $this->remember("explain:{$language}:{$style}:" . md5($term . '|' . $context), $prompt);
    }

    /**
     * Rapikan teks dari hasil OCR yang sering salah baca (typo).
     *
     * @return array<int, string> Paragraf yang sudah dikoreksi.
     */
    public function correctTypo(string $text, string $language = self::DEFAULT_LANGUAGE): array
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

        // Tidak di-cache karena kemungkinan user memfoto ulang dari sudut berbeda,
        // tapi teksnya mirip. Biarkan selalu live ke LLM supaya fresh.
        return $this->ask($prompt);
    }

/** Jaring pengaman untuk pemanggil internal; validasi sebenarnya di controller. */
    private function normalizeLanguage(string $language): string
    {
        return in_array($language, self::LANGUAGES, true) ? $language : self::DEFAULT_LANGUAGE;
    }

    /**
     * Ambil dari cache kalau ada, kalau tidak tanya penyedia lalu simpan.
     *
     * @return array<int, string>
     */
    private function remember(string $suffix, string $prompt): array
    {
        /*
         * Nama provider dan model ikut masuk kunci cache. Tanpa itu, berganti
         * penyedia atau model akan mengembalikan hasil lama milik penyedia
         * sebelumnya, sehingga perbandingan keduanya jadi tidak berarti.
         */
        $key = "ai:{$this->provider->name()}:{$this->provider->model()}:{$suffix}";

        /*
         * Cache di sini murni penghematan kuota, bukan sumber kebenaran. Store yang
         * mati (Redis padam, tabel `cache` di database yang tidak terjangkau) dulu
         * keluar sebagai 500 berisi stack trace dan mematikan fitur AI sepenuhnya —
         * padahal penyedia LLM-nya sendiri sehat. Jadi kegagalan store ditelan:
         * dicatat ke log, lalu permintaan tetap diteruskan tanpa cache.
         */
        try {
            if (is_array($hit = Cache::get($key)) && $hit !== []) {
                return $hit;
            }
        } catch (Throwable $e) {
            $this->warnCacheUnavailable('baca', $e);
        }

        $paragraphs = $this->ask($prompt);

        try {
            Cache::put($key, $paragraphs, (int) config('services.ai.cache_ttl'));
        } catch (Throwable $e) {
            $this->warnCacheUnavailable('tulis', $e);
        }

        return $paragraphs;
    }

    /**
     * Satu-satunya tempat penyedia dipanggil, supaya kegagalan jaringan
     * diterjemahkan jadi pesan yang layak dibaca pengguna di semua fitur.
     *
     * @return array<int, string>
     */
    private function ask(string $prompt): array
    {
        try {
            return $this->provider->paragraphsFor($prompt);
        } catch (ConnectionException $e) {
            /*
             * Gagal sebelum ada respons HTTP: internet mati, timeout, atau
             * sertifikat CA belum terpasang di PHP. Tanpa penanganan ini
             * kegagalannya keluar sebagai 500 berisi stack trace, bukan pesan
             * yang bisa ditampilkan ke pengguna.
             */
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
