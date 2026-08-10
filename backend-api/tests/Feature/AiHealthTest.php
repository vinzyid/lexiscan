<?php

namespace Tests\Feature;

use App\Services\SystemSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** GET /api/ai/health dan kerangka respons error API. */
class AiHealthTest extends TestCase
{
    // Dibutuhkan tabel `settings`: sebagian test di bawah menimpa parameter
    // sistem seperti yang dilakukan admin dari dashboard.
    use RefreshDatabase;

    public function test_it_reports_the_active_provider_without_spending_quota(): void
    {
        // Http::preventStrayRequests() di TestCase memastikan health tidak
        // memanggil penyedia; kalau nanti berubah, test ini yang gagal.
        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJson([
                'provider' => 'gemini',
                'model' => 'gemini-3.6-flash',
                'configured' => true,
                'cache' => ['store' => 'array', 'writable' => true],
                'levels' => ['L2', 'L3', 'L4', 'L5'],
                'styles' => ['sederhana', 'analogi', 'nyata'],
            ]);
    }

    public function test_it_publishes_the_typography_defaults_the_mobile_app_reads(): void
    {
        /*
         * Kontrak dengan aplikasi: `defaults` adalah satu-satunya jalan bagi
         * admin untuk memperbaiki tampilan awal pengguna baru tanpa merilis
         * ulang APK. Namanya tidak boleh berubah diam-diam.
         */
        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJsonPath('defaults.theme', 'krem')
            ->assertJsonPath('defaults.type_level', 'sedang');
    }

    public function test_an_admin_override_reaches_the_mobile_app(): void
    {
        app(SystemSettings::class)->put(SystemSettings::KEY_TYPOGRAPHY, [
            'theme' => 'gelap',
            'type_level' => 'berat',
        ]);

        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJsonPath('defaults.theme', 'gelap')
            ->assertJsonPath('defaults.type_level', 'berat');
    }

    public function test_it_reports_a_missing_api_key_instead_of_pretending_to_be_ready(): void
    {
        config(['services.gemini.key' => '']);

        $this->getJson('/api/ai/health')
            ->assertOk()
            ->assertJsonPath('configured', false);
    }

    public function test_an_unknown_endpoint_answers_in_indonesian(): void
    {
        // Aplikasi mobile menampilkan `message` mentah, termasuk untuk 404.
        $this->getJson('/api/tidak-ada')
            ->assertStatus(404)
            ->assertJsonPath('message', 'Alamat endpoint tidak ditemukan di server.');
    }

    public function test_a_wrong_http_method_answers_in_indonesian(): void
    {
        $this->getJson('/api/simplify-text')
            ->assertStatus(405)
            ->assertJsonPath('message', 'Metode HTTP ini tidak didukung untuk endpoint tersebut.');
    }

    public function test_the_ai_endpoints_are_rate_limited(): void
    {
        // 20 permintaan per menit per IP; batas ini yang menjaga kuota LLM.
        for ($i = 0; $i < 20; $i++) {
            $this->postJson('/api/simplify-text', ['level' => 'salah'])->assertStatus(422);
        }

        $this->postJson('/api/simplify-text', ['level' => 'salah'])
            ->assertStatus(429)
            ->assertJsonPath('message', fn (string $message): bool => str_contains($message, 'Terlalu banyak permintaan'));
    }
}
