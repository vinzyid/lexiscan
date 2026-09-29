<?php

namespace Tests\Feature;

use App\Services\Ai\GriphubProvider;
use App\Services\Ai\ProviderExhaustedException;
use App\Services\Ai\ProviderResponseException;
use Illuminate\Support\Facades\Http;
use RuntimeException;
use Tests\TestCase;

/**
 * GRIPHUB_MODEL boleh memuat beberapa model dipisah koma. Yang berikutnya
 * mengambil alih begitu yang sebelumnya gagal — semuanya masih lewat satu kunci
 * dan satu endpoint, jadi ini cadangan di dalam Griphub sendiri.
 */
class GriphubMultiModelTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.ai.provider' => 'griphub',
            'services.ai.fallback' => '',
            'services.griphub.key' => 'kunci-uji',
            'services.griphub.base_url' => 'https://griphubrouter.web.id/v1',
            'services.griphub.model' => 'gemini-3.8-flash,deepseek-v4.1-flash',
        ]);
    }

    private function body(array $paragraphs): array
    {
        return [
            'choices' => [['message' => ['content' => json_encode(['paragraphs' => $paragraphs])]]],
            'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 5],
        ];
    }

    public function test_model_reports_the_first_entry_for_logs_and_cache(): void
    {
        $this->assertSame('gemini-3.8-flash', (new GriphubProvider)->model());
    }

    public function test_it_uses_the_only_model_when_just_one_is_configured(): void
    {
        config(['services.griphub.model' => 'gemini-3.8-flash']);

        Http::fake(['griphubrouter.web.id/*' => Http::response($this->body(['Satu model.']))]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])
            ->assertOk()
            ->assertJsonPath('paragraphs', ['Satu model.']);

        Http::assertSentCount(1);
    }

    public function test_it_falls_over_to_the_next_model_when_the_first_times_out(): void
    {
        $seen = [];

        Http::fake(function ($request) use (&$seen) {
            $seen[] = $request['model'];

            return $request['model'] === 'gemini-3.8-flash'
                ? Http::response(['error' => ['message' => 'rate limited']], 429)
                : Http::response($this->body(['Dijawab model kedua.']));
        });

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])
            ->assertOk()
            ->assertJsonPath('paragraphs', ['Dijawab model kedua.']);

        // Yang pertama diulang LlmHttp beberapa kali, lalu yang kedua dipanggil.
        $this->assertContains('gemini-3.8-flash', $seen);
        $this->assertSame('deepseek-v4.1-flash', end($seen));
    }

    public function test_it_falls_over_when_the_first_model_replies_with_an_unreadable_body(): void
    {
        $seen = [];

        Http::fake(function ($request) use (&$seen) {
            $seen[] = $request['model'];

            return $request['model'] === 'gemini-3.8-flash'
                ? Http::response([
                    'choices' => [['message' => ['content' => 'Maaf, saya tidak bisa membantu.']]],
                ])
                : Http::response($this->body(['Dijawab model kedua.']));
        });

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])
            ->assertOk()
            ->assertJsonPath('paragraphs', ['Dijawab model kedua.']);

        $this->assertSame(['gemini-3.8-flash', 'deepseek-v4.1-flash'], $seen);
    }

    public function test_a_bad_api_key_does_not_try_the_next_model(): void
    {
        // Kunci salah berarti semua model di bawah kunci itu gagal; mencoba
        // yang kedua hanya membuang waktu.
        Http::fake(['griphubrouter.web.id/*' => Http::response(['error' => ['message' => 'unauthorized']], 401)]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])->assertStatus(503);

        Http::assertSentCount(1);
    }

    public function test_the_last_model_error_is_what_surfaces(): void
    {
        Http::fake(['griphubrouter.web.id/*' => Http::response(['error' => ['message' => 'rate limited']], 429)]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])->assertStatus(503);
    }

    public function test_an_empty_model_list_falls_back_to_the_built_in_default(): void
    {
        config(['services.griphub.model' => '']);

        $this->assertSame('gemini-3.8-flash', (new GriphubProvider)->model());
    }

    public function test_it_ignores_blank_entries_around_commas(): void
    {
        config(['services.griphub.model' => ' gemini-3.8-flash , , deepseek-v4.1-flash ']);

        Http::fake(['griphubrouter.web.id/*' => Http::response($this->body(['Rapi.']))]);

        $this->postJson('/api/simplify-text', [
            'text' => 'Fotosintesis merupakan proses anabolisme pada tumbuhan hijau.',
            'level' => 'L3',
        ])->assertOk();

        Http::assertSent(fn ($request): bool => $request['model'] === 'gemini-3.8-flash');
    }
}
