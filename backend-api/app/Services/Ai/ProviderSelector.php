<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

/**
 * Factory untuk memilih provider AI berdasarkan permintaan pengguna.
 *
 * Digunakan untuk fallback otomatis: jika Griphub gagal, coba Gemini/OpenRouter/XAI.
 */
class ProviderSelector implements AiProvider
{
    public function __construct(
        private readonly array $providers,
    ) {}

    /** Pilih provider berdasarkan nama (griphub, gemini, openrouter, xai). */
    public static function makeFromConfig(string $providerName): self
    {
        $providers = [];
        
        // Buat instance untuk semua provider yang sudah dikonfigurasi
        if ((new GriphubProvider)->isConfigured()) {
            $providers['griphub'] = new GriphubProvider;
        }
        
        if ((new GeminiProvider)->isConfigured()) {
            $providers['gemini'] = new GeminiProvider;
        }
        
        if ((new OpenRouterProvider)->isConfigured()) {
            $providers['openrouter'] = new OpenRouterProvider;
        }
        
        if ((new GrokProvider)->isConfigured()) {
            $providers['xai'] = new GrokProvider;
        }
        
        return new self($providers);
    }

    /** Ambil provider tertentu berdasarkan nama. */
    private function getProvider(string $name): AiProvider
    {
        return $this->providers[$name] ?? throw new \RuntimeException("Provider '{$name}' tidak tersedia.");
    }

    /**
     * Coba semua provider yang tersedia, lempar error hanya jika semuanya gagal.
     */
    public function paragraphsFor(string $prompt): LlmResult
    {
        $errors = [];
        
        foreach ($this->providers as $name => $provider) {
            try {
                Log::info('Menjawab dengan ' . $name, ['prompt_preview' => substr($prompt, 0, 100)]);
                
                return $provider->paragraphsFor($prompt);
            } catch (\Throwable $e) {
                $errors[$name] = $e->getMessage();
                Log::warning('Provider ' . $name . ' gagal', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }
        
        // Semua provider gagal
        throw new \RuntimeException(
            'Semua penyedia AI gagal: ' . implode('; ', $errors)
        );
    }

    public function name(): string
    {
        return 'multi';
    }

    public function model(): string
    {
        return join(', ', array_keys($this->providers));
    }

    public function isConfigured(): bool
    {
        return count($this->providers) > 0;
    }
}
