<?php

namespace Tests\Feature;

use App\Services\Ai\AiProvider;
use App\Services\Ai\FallbackProvider;
use Illuminate\Support\Facades\Http;
use Tests\FakesGemini;
use Tests\TestCase;

/**
 * AI_FALLBACK_PROVIDER: penyedia cadangan mengambil alih saat yang utama
 * kehabisan jatah.
 *
 * Yang dijaga di sini bukan cuma "ada cadangan", tapi kapan ia BOLEH dan TIDAK
 * BOLEH dipakai — cadangan yang menutupi kunci salah membuat konfigurasi rusak
 * jadi tak terlihat sampai keduanya sama-sama mati.
 */
class ProviderFallbackTest extends TestCase
{
    use FakesGemini;

    private const OPENROUTER_URL = 'openrouter.ai/*';

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.ai.provider' => 'gemini', 'services.ai.fallback' => 'openrouter']);
    }

    public function test_it_switches_to_the_fallback_when_the_daily_quota_runs_out(): void
    {
        Http::fake([
            self::GEMINI_URL => Http::response(['error' => ['message' => 'quota exceeded']], 429),
            self::OPENROUTER_URL => Http::response($this->openRouterBody(['Dijawab cadangan.'])),
        ]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])
            ->assertOk()
            ->assertJsonPath('paragraphs', ['Dijawab cadangan.']);
    }

    public function test_it_switches_when_the_primary_provider_is_down(): void
    {
        // 5xx sesudah semua ulangan LlmHttp habis: jatahnya memang tidak ada,
        // sama saja dengan kuota habis dari sudut pandang pengguna.
        Http::fake([
            self::GEMINI_URL => Http::response(['error' => ['message' => 'internal']], 503),
            self::OPENROUTER_URL => Http::response($this->openRouterBody(['Tetap terjawab.'])),
        ]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])
            ->assertOk()
            ->assertJsonPath('paragraphs', ['Tetap terjawab.']);
    }

    public function test_a_rejected_key_is_not_papered_over_by_the_fallback(): void
    {
        Http::fake([
            self::GEMINI_URL => Http::response(['error' => ['message' => 'API key not valid']], 400),
            self::OPENROUTER_URL => Http::response($this->openRouterBody(['Tidak boleh dipakai.'])),
        ]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])->assertStatus(503);

        Http::assertNotSent(fn ($request): bool => str_contains($request->url(), 'openrouter.ai'));
    }

    public function test_the_fallback_error_is_what_the_user_sees_when_both_are_exhausted(): void
    {
        Http::fake([
            self::GEMINI_URL => Http::response(['error' => ['message' => 'quota exceeded']], 429),
            self::OPENROUTER_URL => Http::response(['error' => ['message' => 'no credit']], 402),
        ]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])
            ->assertStatus(503)
            ->assertJsonPath('message', fn (string $message): bool => str_contains($message, 'Saldo OpenRouter'));
    }

    public function test_an_answer_from_the_fallback_is_cached_under_the_primary_key(): void
    {
        /*
         * Kuncinya memakai identitas penyedia utama, jadi permintaan kedua
         * dilayani simpanan tanpa menyentuh jaringan sama sekali — termasuk
         * saat kuota Gemini nanti pulih. Yang disimpan jawabannya, bukan
         * catatan siapa yang membuatnya.
         */
        Http::fake([
            self::GEMINI_URL => Http::response(['error' => ['message' => 'quota exceeded']], 429),
            self::OPENROUTER_URL => Http::response($this->openRouterBody(['Sekali saja.'])),
        ]);

        $payload = [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ];

        $this->postJson('/api/simplify-text', $payload)->assertOk();

        $before = count(Http::recorded());

        $this->postJson('/api/simplify-text', $payload)
            ->assertOk()
            ->assertJsonPath('paragraphs', ['Sekali saja.'])
            ->assertJsonPath('footprint.cached', true);

        $this->assertSame($before, count(Http::recorded()));
    }

    public function test_the_health_endpoint_names_the_standby_provider(): void
    {
        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJson(['provider' => 'gemini', 'fallback' => 'openrouter']);
    }

    public function test_no_fallback_is_wired_up_when_the_setting_is_empty(): void
    {
        config(['services.ai.fallback' => '']);

        $this->assertNotInstanceOf(FallbackProvider::class, app(AiProvider::class));

        $this->getJson('/api/ai/health')->assertJsonPath('fallback', null);
    }

    public function test_naming_the_primary_as_its_own_fallback_changes_nothing(): void
    {
        // Membungkusnya hanya membuat satu kegagalan dicoba dua kali.
        config(['services.ai.fallback' => 'gemini']);

        $this->assertNotInstanceOf(FallbackProvider::class, app(AiProvider::class));
    }

    /**
     * @param  array<int, string>  $paragraphs
     * @return array<string, mixed>
     */
    private function openRouterBody(array $paragraphs): array
    {
        return [
            'choices' => [['message' => ['content' => json_encode(['paragraphs' => $paragraphs])]]],
            'usage' => ['prompt_tokens' => 120, 'completion_tokens' => 80],
        ];
    }
}
