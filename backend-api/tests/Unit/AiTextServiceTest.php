<?php

namespace Tests\Unit;

use App\Services\Ai\AiProvider;
use App\Services\Ai\LlmResult;
use App\Services\Ai\TokenUsage;
use App\Services\AiTextService;
use App\Services\SystemSettings;
use Illuminate\Contracts\Cache\Repository;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class AiTextServiceTest extends TestCase
{
    public function test_a_failing_cache_store_does_not_break_simplification(): void
    {
        /*
         * Regresi: CACHE_STORE menunjuk Postgres remote yang tidak terjangkau,
         * dan seluruh fitur AI mati dengan 500 stack trace meski penyedia LLM-nya
         * sehat. Cache di sini hanya penghematan kuota, bukan syarat jalan.
         */
        $broken = Mockery::mock(Repository::class);
        $broken->shouldReceive('get')->andThrow(new RuntimeException('cache tidak terjangkau'));
        $broken->shouldReceive('put')->andThrow(new RuntimeException('cache tidak terjangkau'));
        Cache::swap($broken);

        $service = new AiTextService($this->providerReturning(['Tetap jalan.']));

        $this->assertSame(['Tetap jalan.'], $service->simplify('Teks cukup panjang.', 'L3')->paragraphs);
    }

    public function test_a_cache_hit_skips_the_provider_entirely(): void
    {
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        // Kuota LLM gratis terbatas: cache hit tidak boleh memanggil penyedia.
        $provider->shouldNotReceive('paragraphsFor');

        Cache::swap($this->cacheReturning([
            'paragraphs' => ['Dari cache.'],
            'tokens' => ['input' => 500, 'output' => 400],
        ]));

        $service = new AiTextService($provider);

        $this->assertSame(['Dari cache.'], $service->simplify('Teks cukup panjang.', 'L3')->paragraphs);
    }

    public function test_a_cache_hit_counts_as_avoided_emissions_not_as_zero_usage(): void
    {
        /*
         * Inti fitur jejak karbon: jawaban dari cache tidak menjalankan model
         * sama sekali, jadi biayanya nol DAN penghematannya harus tercatat.
         * Kalau keduanya nol, penghematan yang nyata jadi tak terlihat.
         */
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldNotReceive('paragraphsFor');

        Cache::swap($this->cacheReturning([
            'paragraphs' => ['Dari cache.'],
            'tokens' => ['input' => 500, 'output' => 400],
        ]));

        $footprint = (new AiTextService($provider))->simplify('Teks cukup panjang.', 'L3')->footprint;

        $this->assertTrue($footprint->cached);
        $this->assertSame(0.0, $footprint->co2eGrams);
        $this->assertGreaterThan(0, $footprint->avoidedCo2eGrams);
    }

    public function test_a_fresh_call_counts_as_spent_not_as_avoided(): void
    {
        Cache::swap($this->passthroughCache());

        $footprint = (new AiTextService($this->providerReturning(['Baru.'])))
            ->simplify('Teks cukup panjang.', 'L3')
            ->footprint;

        $this->assertFalse($footprint->cached);
        $this->assertGreaterThan(0, $footprint->co2eGrams);
        $this->assertSame(0.0, $footprint->avoidedCo2eGrams);
    }

    public function test_a_cache_entry_written_before_tokens_were_tracked_is_still_usable(): void
    {
        /*
         * Entri lama berisi daftar paragraf polos. Masih berlaku sampai TTL-nya
         * habis, jadi harus tetap dipakai — hanya jejak karbonnya yang tidak
         * bisa ditaksir, dan itu ditandai lewat 'known'.
         */
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldNotReceive('paragraphsFor');

        Cache::swap($this->cacheReturning(['Format lama.']));

        $answer = (new AiTextService($provider))->simplify('Teks cukup panjang.', 'L3');

        $this->assertSame(['Format lama.'], $answer->paragraphs);
        $this->assertFalse($answer->footprint->isKnown());
    }

    public function test_the_token_count_is_stored_alongside_the_cached_paragraphs(): void
    {
        // Tanpa ini, cache hit berikutnya tidak punya dasar untuk menaksir
        // penghematannya.
        $stored = null;

        $cache = Mockery::mock(Repository::class);
        $cache->shouldReceive('get')->andReturn(null);
        $cache->shouldReceive('put')->andReturnUsing(function (string $key, $value) use (&$stored): bool {
            $stored = $value;

            return true;
        });
        Cache::swap($cache);

        (new AiTextService($this->providerReturning(['Baru.'])))->simplify('Teks cukup panjang.', 'L3');

        $this->assertSame(['Baru.'], $stored['paragraphs']);
        $this->assertSame(500, $stored['tokens']['input']);
        $this->assertSame(400, $stored['tokens']['output']);
    }

    public function test_results_are_stored_permanently_by_default(): void
    {
        /*
         * Jawaban atas teks yang sama tidak pernah basi, jadi membiarkannya
         * kedaluwarsa berarti menyalakan model lagi untuk pertanyaan yang sudah
         * pernah dijawab. TTL null adalah cara Laravel menyimpan selamanya.
         */
        $ttl = 'belum diisi';

        $cache = Mockery::mock(Repository::class);
        $cache->shouldReceive('get')->andReturn(null);
        $cache->shouldReceive('put')->andReturnUsing(function ($key, $value, $seconds) use (&$ttl): bool {
            $ttl = $seconds;

            return true;
        });
        Cache::swap($cache);

        (new AiTextService($this->providerReturning(['Baru.'])))->simplify('Teks cukup panjang.', 'L3');

        $this->assertNull($ttl);
    }

    public function test_editing_a_prompt_rule_changes_the_cache_key(): void
    {
        /*
         * Simpanannya permanen dan kuncinya hanya memuat teks masukan, jadi
         * tanpa sidik jari prompt, aturan yang baru disunting admin tidak akan
         * pernah menggantikan hasil lama — tidak ada TTL yang menolong lagi.
         */
        $before = $this->cacheKeyForSimplify(new SystemSettings);

        $settings = Mockery::mock(SystemSettings::class);
        $settings->shouldReceive('get')->andReturnUsing(
            fn (string $key, array $default) => $key === SystemSettings::KEY_SIMPLIFY_RULES
                ? ['id' => ['L3' => 'Aturan yang baru saja disunting admin.']] + $default
                : $default,
        );

        $after = $this->cacheKeyForSimplify($settings);

        $this->assertNotSame($before, $after);
        $this->assertStringStartsWith('ai:', (string) $before);
    }

    /** Kunci cache yang dipakai satu permintaan simplify dengan parameter tertentu. */
    private function cacheKeyForSimplify(SystemSettings $settings): ?string
    {
        $key = null;

        $cache = Mockery::mock(Repository::class);
        $cache->shouldReceive('get')->andReturnUsing(function (string $seen) use (&$key) {
            $key = $seen;

            return null;
        });
        $cache->shouldReceive('put')->andReturn(true);
        Cache::swap($cache);

        (new AiTextService($this->providerReturning(['Baru.']), null, $settings))
            ->simplify('Teks cukup panjang.', 'L3');

        return $key;
    }

    public function test_correct_typo_is_never_cached(): void
    {
        $cache = Mockery::mock(Repository::class);
        // Hasil OCR nyaris selalu berbeda, jadi cache di sini hanya beban.
        $cache->shouldNotReceive('get');
        $cache->shouldNotReceive('put');
        Cache::swap($cache);

        $service = new AiTextService($this->providerReturning(['Sudah rapi.']));

        $this->assertSame(['Sudah rapi.'], $service->correctTypo('Teks hasil scan.')->paragraphs);
    }

    public function test_a_connection_failure_becomes_a_readable_message(): void
    {
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldReceive('paragraphsFor')
            ->andThrow(new ConnectionException('cURL error 60: SSL certificate problem'));

        $this->expectException(RuntimeException::class);
        // Tanpa terjemahan ini, pengguna melihat pesan cURL mentah.
        $this->expectExceptionMessage('PHP tidak punya sertifikat CA');

        (new AiTextService($provider))->simplify('Teks cukup panjang.', 'L3');
    }

    public function test_a_timeout_tells_the_reader_what_to_do(): void
    {
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldReceive('paragraphsFor')
            ->andThrow(new ConnectionException('cURL error 28: Operation timed out'));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('tidak merespons');

        (new AiTextService($provider))->simplify('Teks cukup panjang.', 'L3');
    }

    public function test_it_rejects_an_unknown_level_before_spending_quota(): void
    {
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldNotReceive('paragraphsFor');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Level penyederhanaan tidak dikenal');

        (new AiTextService($provider))->simplify('Teks cukup panjang.', 'L9');
    }

    public function test_the_prompt_carries_the_surrounding_sentence_when_given(): void
    {
        $captured = null;

        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldReceive('paragraphsFor')
            ->andReturnUsing(function (string $prompt) use (&$captured): LlmResult {
                $captured = $prompt;

                return new LlmResult(['ok'], new TokenUsage(500, 400));
            });

        Cache::swap($this->passthroughCache());

        (new AiTextService($provider))->explain('anabolisme', 'analogi', 'Fotosintesis adalah anabolisme.');

        $this->assertStringContainsString('Fotosintesis adalah anabolisme.', $captured);
        $this->assertStringContainsString('analogi', $captured);
    }

    public function test_explain_without_context_says_so_explicitly(): void
    {
        $captured = null;

        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldReceive('paragraphsFor')
            ->andReturnUsing(function (string $prompt) use (&$captured): LlmResult {
                $captured = $prompt;

                return new LlmResult(['ok'], new TokenUsage(500, 400));
            });

        Cache::swap($this->passthroughCache());

        (new AiTextService($provider))->explain('anabolisme', 'sederhana');

        // Kalau blok konteks dibiarkan kosong, model mengira konteksnya terpotong.
        $this->assertStringContainsString('Tidak ada konteks tambahan.', $captured);
    }

    /** @param array<int, string> $paragraphs */
    private function providerReturning(array $paragraphs): AiProvider
    {
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldReceive('paragraphsFor')
            ->andReturn(new LlmResult($paragraphs, new TokenUsage(500, 400)));

        return $provider;
    }

    /** Cache yang selalu miss dan menerima penulisan, supaya provider tetap dipanggil. */
    private function passthroughCache(): Repository
    {
        $cache = Mockery::mock(Repository::class);
        $cache->shouldReceive('get')->andReturn(null);
        $cache->shouldReceive('put')->andReturn(true);

        return $cache;
    }

    /** @param mixed $entry */
    private function cacheReturning($entry): Repository
    {
        $cache = Mockery::mock(Repository::class);
        $cache->shouldReceive('get')->andReturn($entry);

        return $cache;
    }
}
