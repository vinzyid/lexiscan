<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

/**
 * Rantai penyedia AI untuk fitur Tanya Lexi (AI Explain This).
 *
 * Backend mencobanya berurutan dan berhenti di penyedia pertama yang berhasil.
 * Tujuannya sama seperti FallbackProvider pada fitur penyederhanaan: kuota
 * gratis bisa habis di tengah demo, dan "coba lagi besok" bukan jawaban yang
 * bisa diterima saat juri sedang mencoba aplikasinya.
 *
 * DAFTAR PENYEDIA DIBANGUN DARI KUNCI YANG ADA, bukan dari nama yang diminta
 * aplikasi. Nama itu hanya dipakai untuk menyusun urutannya: yang diminta
 * dicoba lebih dulu, sisanya menyusul sebagai cadangan. Dengan begitu aplikasi
 * tidak perlu tahu kunci mana yang terisi di server, dan menambah atau melepas
 * kunci tidak menuntut rilis ulang APK.
 *
 * Nama penyedia yang tidak dikenal cukup dilewati, bukan dijadikan galat:
 * aplikasi versi baru boleh saja menyarankan penyedia yang belum ada waktu
 * backend ini dirilis.
 */
class ProviderSelector implements AiProvider
{
    /**
     * Semua nama penyedia yang dikenal kode ini. Daftar tunggal, dipakai untuk
     * validasi permintaan dan untuk pesan galat, supaya menambah penyedia baru
     * tidak perlu menyunting dua tempat.
     *
     * @var array<int, string>
     */
    public const SUPPORTED = ['gemini', 'grok', 'mistral', 'openrouter', 'griphub'];

    /**
     * Urutan cadangan bawaan, dari yang paling diutamakan. Yang diminta
     * aplikasi selalu dicoba lebih dulu, apa pun isi daftar ini.
     */
    private const ORDER = ['gemini', 'griphub', 'openrouter', 'grok', 'mistral'];

    /** @param  array<int, AiProvider>  $providers  Terurut; kosong berarti tidak ada yang siap. */
    public function __construct(
        private readonly array $providers,
    ) {}

    public static function makeFromConfig(?string $preferred = null): self
    {
        $ordered = [];

        // Yang diminta aplikasi lebih dulu, kalau memang terkonfigurasi.
        $wanted = $preferred !== null ? self::build($preferred) : null;

        if ($wanted !== null && $wanted->isConfigured()) {
            $ordered[] = $wanted;
        }

        // Sisanya menyusul tanpa mengulang yang sudah masuk.
        foreach (self::ORDER as $name) {
            $provider = self::build($name);

            if ($provider === null || ! $provider->isConfigured()) {
                continue;
            }

            foreach ($ordered as $already) {
                if ($already->name() === $provider->name()) {
                    continue 2;
                }
            }

            $ordered[] = $provider;
        }

        return new self($ordered);
    }

    /** Null untuk nama yang tidak dikenal — bukan galat, hanya dilewati. */
    private static function build(string $name): ?AiProvider
    {
        return match ($name) {
            'gemini' => new GeminiProvider,
            'grok' => new GrokProvider,
            'mistral' => new MistralProvider,
            'openrouter' => new OpenRouterProvider,
            'griphub' => new GriphubProvider,
            default => null,
        };
    }

    /**
     * Coba setiap penyedia berurutan; hanya gagal kalau semuanya gagal.
     *
     * Pesan galat terakhir dilempar apa adanya setelah semua percobaan habis,
     * supaya yang dilihat pengguna adalah keadaan penyedia terakhir yang
     * benar-benar dicoba — bukan tumpukan galat yang menyesatkan.
     */
    public function paragraphsFor(string $prompt): LlmResult
    {
        if ($this->providers === []) {
            throw new RuntimeException(
                'Tidak ada penyedia AI yang terkonfigurasi di server. Hubungi pengelola aplikasi.'
            );
        }

        $last = null;

        foreach ($this->providers as $provider) {
            try {
                return $provider->paragraphsFor($prompt);
            } catch (Throwable $e) {
                $last = $e;

                Log::warning('Penyedia AI gagal, mencoba berikutnya', [
                    'provider' => $provider->name(),
                    'error' => $e->getMessage(),
                ]);
            }
        }

        throw $last;
    }

    /**
     * Identitas penyedia pertama pada rantai. Dipakai untuk log, kunci cache,
     * dan laporan pemakaian — sama seperti FallbackProvider.
     */
    public function name(): string
    {
        return $this->providers[0]->name();
    }

    public function model(): string
    {
        return $this->providers[0]->model();
    }

    public function isConfigured(): bool
    {
        return $this->providers !== [];
    }
}
