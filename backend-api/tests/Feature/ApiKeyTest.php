<?php

namespace Tests\Feature;

use App\Http\Middleware\RequireApiKey;
use Tests\FakesGemini;
use Tests\TestCase;

/**
 * Penjagaan X-Api-Key pada endpoint AI. Test lain tidak mengirim kunci karena
 * APP_ENV=testing mematikan penjagaan, jadi hanya berkas ini yang menyalakannya.
 */
class ApiKeyTest extends TestCase
{
    use FakesGemini;

    /** Payload sah untuk /api/simplify-text; isinya tidak penting bagi test ini. */
    private const PAYLOAD = [
        'text' => 'Fotosintesis adalah proses tumbuhan mengubah cahaya matahari menjadi makanan.',
        'level' => 'L3',
    ];

    private function enforceKey(string $key = 'kunci-rahasia'): void
    {
        config([
            'services.ai.require_api_key' => true,
            'services.ai.api_key' => $key,
        ]);
    }

    public function test_it_lets_the_request_through_on_a_developer_machine(): void
    {
        // APP_ENV=testing, jadi penjagaan mati dan alur lokal tidak terganggu.
        $this->fakeGeminiParagraphs(['Tumbuhan membuat makanan dari cahaya matahari.']);

        $this->postJson('/api/simplify-text', self::PAYLOAD)->assertOk();
    }

    public function test_it_rejects_a_request_without_the_key(): void
    {
        $this->enforceKey();

        // Http::preventStrayRequests() memastikan penolakan terjadi SEBELUM
        // penyedia dipanggil — kalau tidak, test ini gagal karena stray request.
        $this->postJson('/api/simplify-text', self::PAYLOAD)
            ->assertStatus(401)
            ->assertJsonPath('message', fn (string $m): bool => str_contains($m, 'tidak dikenali server'));
    }

    public function test_it_rejects_a_wrong_key(): void
    {
        $this->enforceKey();

        $this->postJson('/api/simplify-text', self::PAYLOAD, [RequireApiKey::HEADER => 'kunci-salah'])
            ->assertStatus(401);
    }

    public function test_it_accepts_the_matching_key(): void
    {
        $this->enforceKey();
        $this->fakeGeminiParagraphs(['Tumbuhan membuat makanan dari cahaya matahari.']);

        $this->postJson('/api/simplify-text', self::PAYLOAD, [RequireApiKey::HEADER => 'kunci-rahasia'])
            ->assertOk()
            ->assertJsonPath('paragraphs.0', 'Tumbuhan membuat makanan dari cahaya matahari.');
    }

    public function test_it_guards_every_ai_endpoint_not_just_the_first(): void
    {
        $this->enforceKey();

        $this->postJson('/api/explain-word', ['term' => 'fotosintesis', 'style' => 'analogi'])
            ->assertStatus(401);

        $this->postJson('/api/correct-typo', ['text' => 'Teks hasil scan yang perlu dirapikan.'])
            ->assertStatus(401);
    }

    public function test_a_production_server_without_a_key_refuses_instead_of_opening_up(): void
    {
        // Deploy production tapi AI_API_KEY lupa diisi: harus menolak, bukan
        // melewatkan permintaan.
        config([
            'services.ai.require_api_key' => true,
            'services.ai.api_key' => '',
        ]);

        $this->postJson('/api/simplify-text', self::PAYLOAD)
            ->assertStatus(503)
            ->assertJsonPath('message', fn (string $m): bool => str_contains($m, 'AI_API_KEY'));
    }

    public function test_health_stays_open_so_the_deploy_can_be_verified_from_outside(): void
    {
        $this->enforceKey();

        // Satu-satunya endpoint yang bisa dipakai memeriksa status penjagaan
        // dari luar setelah deploy.
        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJsonPath('auth.required', true)
            ->assertJsonPath('auth.key_set', true);
    }

    public function test_health_shows_when_the_key_is_missing_in_production(): void
    {
        config([
            'services.ai.require_api_key' => true,
            'services.ai.api_key' => '',
        ]);

        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJsonPath('auth.required', true)
            ->assertJsonPath('auth.key_set', false);
    }

    public function test_health_never_leaks_the_key_itself(): void
    {
        $this->enforceKey('kunci-yang-tidak-boleh-bocor');

        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertDontSee('kunci-yang-tidak-boleh-bocor');
    }
}
