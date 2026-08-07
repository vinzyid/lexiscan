<?php

namespace App\Providers;

use App\Services\Ai\AiProvider;
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
            $provider = (string) config('services.ai.provider');

            return match ($provider) {
                'gemini' => new GeminiProvider,
                'grok' => new GrokProvider,
                'mistral' => new MistralProvider,
                'openrouter' => new OpenRouterProvider,
                default => throw new InvalidArgumentException(
                    "AI_PROVIDER tidak dikenal: '{$provider}'. Pilihannya: gemini, grok, mistral, openrouter."
                ),
            };
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
}
