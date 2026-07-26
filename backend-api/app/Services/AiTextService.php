<?php

namespace App\Services;

use App\Services\Ai\AiProvider;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use RuntimeException;

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
    /** Instruksi per level penyederhanaan, dipakai apa adanya di prompt. */
    private const SIMPLIFY_RULES = [
        'L2' => 'Pertahankan semua istilah teknis, tetapi pecah kalimat panjang menjadi kalimat pendek. Ini hanya sedikit lebih mudah dari aslinya.',
        'L3' => 'Gunakan bahasa sehari-hari yang santai. Istilah teknis boleh diganti padanan awam, tetapi fakta harus tetap akurat.',
        'L4' => 'Format Easy Read: sangat singkat dan padat. Boleh memakai tanda panah atau tanda sama dengan untuk menunjukkan hubungan.',
        'L5' => 'Sesederhana mungkin, setara pemahaman anak sekolah dasar. Gunakan kalimat sangat pendek dan kata yang paling umum.',
    ];

    /** Gaya penjelasan pada fitur AI Explain This. */
    private const EXPLAIN_STYLES = [
        'anak10' => 'Jelaskan seperti sedang berbicara kepada anak berusia 10 tahun. Ramah dan sederhana.',
        'analogi' => 'Jelaskan memakai satu analogi atau perumpamaan yang mudah dibayangkan, lalu kaitkan kembali ke konsep aslinya.',
        'nyata' => 'Jelaskan lewat contoh konkret dari kehidupan sehari-hari yang kemungkinan pernah dialami pembaca.',
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
        return array_keys(self::SIMPLIFY_RULES);
    }

    /** @return array<int, string> */
    public function availableExplainStyles(): array
    {
        return array_keys(self::EXPLAIN_STYLES);
    }

    /**
     * Sederhanakan teks ke level tertentu.
     *
     * @return array<int, string> Paragraf hasil penyederhanaan.
     */
    public function simplify(string $text, string $level): array
    {
        $rule = self::SIMPLIFY_RULES[$level]
            ?? throw new RuntimeException("Level penyederhanaan tidak dikenal: {$level}");

        $prompt = <<<PROMPT
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

        return $this->remember("simplify:{$level}:" . md5($text), $prompt);
    }

    /**
     * Jelaskan sebuah kata atau potongan teks dengan gaya tertentu.
     *
     * @return array<int, string> Paragraf penjelasan.
     */
    public function explain(string $term, string $style, ?string $context = null): array
    {
        $styleRule = self::EXPLAIN_STYLES[$style]
            ?? throw new RuntimeException("Gaya penjelasan tidak dikenal: {$style}");

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

        {$contextBlock}
        PROMPT;

        return $this->remember("explain:{$style}:" . md5($term . '|' . $context), $prompt);
    }

    /**
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

        try {
            return Cache::remember($key, (int) config('services.ai.cache_ttl'), fn (): array => $this->provider->paragraphsFor($prompt));
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
                str_contains($e->getMessage(), 'certificate')
                    ? 'PHP tidak punya sertifikat CA, jadi koneksi HTTPS ditolak. Atur curl.cainfo di php.ini.'
                    : 'Tidak bisa menghubungi server AI. Periksa koneksi internet lalu coba lagi.',
                previous: $e,
            );
        }
    }
}
