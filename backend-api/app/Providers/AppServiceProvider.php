<?php

namespace App\Providers;

use App\Services\Ai\AiProvider;
use App\Services\Ai\GeminiProvider;
use App\Services\Ai\GrokProvider;
use App\Services\Ai\OpenRouterProvider;
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
                'openrouter' => new OpenRouterProvider,
                default => throw new InvalidArgumentException(
                    "AI_PROVIDER tidak dikenal: '{$provider}'. Pilihannya: gemini, grok, openrouter."
                ),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
