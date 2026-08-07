<?php

namespace App\Providers;

use App\Services\Ai\AiProvider;
use App\Services\Ai\FallbackProvider;
use App\Services\Ai\GeminiProvider;
use App\Services\Ai\GrokProvider;
use App\Services\Ai\MistralProvider;
use App\Services\Ai\OpenRouterProvider;
use App\Services\SystemSettings;
use Illuminate\Support\ServiceProvider;
use InvalidArgumentException;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Penyedia LLM dipilih lewat AI_PROVIDER di .env; lihat config/services.php.
        $this->app->bind(AiProvider::class, function (): AiProvider {
            $primary = $this->makeProvider((string) config('services.ai.provider'), 'AI_PROVIDER');
            $fallback = (string) config('services.ai.fallback');

            /*
             * Cadangan yang sama dengan yang utama tidak menambah apa pun, dan
             * membungkusnya justru membuat satu kegagalan dicoba dua kali.
             */
            if (blank($fallback) || $fallback === $primary->name()) {
                return $primary;
            }

            return new FallbackProvider(
                $primary,
                $this->makeProvider($fallback, 'AI_FALLBACK_PROVIDER'),
            );
        });

        /*
         * Singleton supaya parameter sistem cukup dibaca sekali per permintaan,
         * meski dipakai controller, service prompt, dan dashboard sekaligus.
         * Umurnya sengaja tidak lebih panjang dari permintaannya — lihat
         * penjelasan memo di SystemSettings.
         */
        $this->app->singleton(SystemSettings::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }

    /** @param  string  $setting  Nama variabel .env-nya, supaya pesan galatnya menunjuk yang benar. */
    private function makeProvider(string $name, string $setting): AiProvider
    {
        return match ($name) {
            'gemini' => new GeminiProvider,
            'grok' => new GrokProvider,
            'mistral' => new MistralProvider,
            'openrouter' => new OpenRouterProvider,
            default => throw new InvalidArgumentException(
                "{$setting} tidak dikenal: '{$name}'. Pilihannya: gemini, grok, mistral, openrouter."
            ),
        };
    }
}
