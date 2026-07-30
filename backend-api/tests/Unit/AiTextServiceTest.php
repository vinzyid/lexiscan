<?php

namespace Tests\Unit;

use App\Services\Ai\AiProvider;
use App\Services\AiTextService;
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

        $this->assertSame(['Tetap jalan.'], $service->simplify('Teks cukup panjang.', 'L3'));
    }

    public function test_a_cache_hit_skips_the_provider_entirely(): void
    {
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        // Kuota LLM gratis terbatas: cache hit tidak boleh memanggil penyedia.
        $provider->shouldNotReceive('paragraphsFor');

        $cache = Mockery::mock(Repository::class);
        $cache->shouldReceive('get')->andReturn(['Dari cache.']);
        Cache::swap($cache);

        $service = new AiTextService($provider);

        $this->assertSame(['Dari cache.'], $service->simplify('Teks cukup panjang.', 'L3'));
    }

    public function test_correct_typo_is_never_cached(): void
    {
        $cache = Mockery::mock(Repository::class);
        // Hasil OCR nyaris selalu berbeda, jadi cache di sini hanya beban.
        $cache->shouldNotReceive('get');
        $cache->shouldNotReceive('put');
        Cache::swap($cache);

        $service = new AiTextService($this->providerReturning(['Sudah rapi.']));

        $this->assertSame(['Sudah rapi.'], $service->correctTypo('Teks hasil scan.'));
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
            ->andReturnUsing(function (string $prompt) use (&$captured): array {
                $captured = $prompt;

                return ['ok'];
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
            ->andReturnUsing(function (string $prompt) use (&$captured): array {
                $captured = $prompt;

                return ['ok'];
            });

        Cache::swap($this->passthroughCache());

        (new AiTextService($provider))->explain('anabolisme', 'anak10');

        // Kalau blok konteks dibiarkan kosong, model mengira konteksnya terpotong.
        $this->assertStringContainsString('Tidak ada konteks tambahan.', $captured);
    }

    /** @param array<int, string> $paragraphs */
    private function providerReturning(array $paragraphs): AiProvider
    {
        $provider = Mockery::mock(AiProvider::class);
        $provider->shouldReceive('name')->andReturn('gemini');
        $provider->shouldReceive('model')->andReturn('gemini-3.6-flash');
        $provider->shouldReceive('paragraphsFor')->andReturn($paragraphs);

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
}
