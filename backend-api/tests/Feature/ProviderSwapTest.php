<?php

namespace Tests\Feature;

use App\Services\Ai\AiProvider;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use Tests\TestCase;

/**
 * AI_PROVIDER bisa ditukar tanpa mengubah bentuk respons endpoint mana pun.
 * Itu janji arsitekturnya, jadi diuji untuk keempat penyedia.
 */
class ProviderSwapTest extends TestCase
{
    /** Balasan OpenAI-compatible, dipakai grok, mistral, dan openrouter. */
    private function chatCompletion(array $paragraphs): array
    {
        return [
            'choices' => [['message' => ['content' => json_encode(['paragraphs' => $paragraphs])]]],
        ];
    }

    public static function providers(): array
    {
        return [
            'gemini' => ['gemini', 'generativelanguage.googleapis.com/*'],
            'grok' => ['grok', 'api.x.ai/*'],
            'mistral' => ['mistral', 'api.mistral.ai/*'],
            'openrouter' => ['openrouter', 'openrouter.ai/*'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('providers')]
    public function test_each_provider_answers_with_the_same_response_shape(string $name, string $urlPattern): void
    {
        config([
            'services.ai.provider' => $name,
            "services.{$name}.key" => 'kunci-uji',
            "services.{$name}.model" => 'model-uji',
        ]);

        $body = $name === 'gemini'
            ? ['candidates' => [['content' => ['parts' => [['text' => '{"paragraphs":["Hasil."]}']]], 'finishReason' => 'STOP']]]
            : $this->chatCompletion(['Hasil.']);

        Http::fake([$urlPattern => Http::response($body)]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])
            ->assertOk()
            ->assertJson([
                'level' => 'L3',
                'paragraphs' => ['Hasil.'],
                'provider' => $name,
            ]);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('providers')]
    public function test_each_provider_refuses_to_run_without_a_key(string $name): void
    {
        config(['services.ai.provider' => $name, "services.{$name}.key" => '']);

        // Gagal di sisi kita sebelum ada permintaan jaringan sama sekali.
        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])->assertStatus(503);

        Http::assertNothingSent();
    }

    public function test_an_unknown_provider_name_fails_loudly(): void
    {
        config(['services.ai.provider' => 'tidak-ada']);

        $this->expectException(InvalidArgumentException::class);
        // Pesannya menyebut pilihan yang sah supaya salah ketik cepat ketemu.
        $this->expectExceptionMessage('Pilihannya: gemini, grok, mistral, openrouter.');

        app(AiProvider::class);
    }

    public function test_the_health_endpoint_follows_the_active_provider(): void
    {
        config([
            'services.ai.provider' => 'mistral',
            'services.mistral.key' => 'kunci-uji',
            'services.mistral.model' => 'mistral-small-latest',
        ]);

        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJson(['provider' => 'mistral', 'model' => 'mistral-small-latest', 'configured' => true]);
    }
}
