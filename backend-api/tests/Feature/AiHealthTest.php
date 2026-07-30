<?php

namespace Tests\Feature;

use Tests\TestCase;

/** GET /api/ai/health dan kerangka respons error API. */
class AiHealthTest extends TestCase
{
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
                'styles' => ['anak10', 'analogi', 'nyata'],
            ]);
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
