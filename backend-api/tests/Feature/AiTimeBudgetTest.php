<?php

namespace Tests\Feature;

use App\Services\Ai\AiProvider;
use App\Services\Ai\FallbackProvider;
use App\Services\Ai\LlmResult;
use App\Services\Ai\ProviderExhaustedException;
use App\Services\Ai\ProviderSelector;
use App\Services\Ai\TokenUsage;
use RuntimeException;
use Tests\TestCase;

/**
 * Anggaran waktu AI: seluruh rantai penyedia — utama lalu cadangan, dan tiap
 * model di dalamnya — harus berbagi satu batas waktu.
 *
 * Latar masalahnya nyata: dulu tiap penyedia memakai AI_TIMEOUT (60 detik)
 * sendiri-sendiri, sehingga provider utama yang lambat lalu cadangannya bisa
 * menahan satu permintaan jauh melewati REQUEST_TIMEOUT_MS aplikasi mobile.
 * Aplikasi keburu menyerah padahal server masih bekerja — itu yang membuat
 * fitur penyederhanaan "kebanyakan gagal" walau server tidak sedang mati.
 */
class AiTimeBudgetTest extends TestCase
{
    public function test_the_primary_and_fallback_split_one_shared_budget(): void
    {
        config(['services.ai.total_timeout' => 100]);

        // Provider utama kehabisan jatah, jadi cadangan yang mengambil alih —
        // dan keduanya harus berbagi satu anggaran yang sama.
        $primary = new RecordingProvider('utama', failWith: new ProviderExhaustedException('kuota habis'));
        $fallback = new RecordingProvider('cadangan');

        (new FallbackProvider($primary, $fallback))->paragraphsFor('prompt');

        $this->assertCount(1, $primary->timeouts);
        $this->assertCount(1, $fallback->timeouts);

        // Porsi utama 65%, cadangan sisanya; jumlahnya tidak boleh melebihi total.
        $this->assertEqualsWithDelta(65.0, $primary->timeouts[0], 0.01);
        $this->assertEqualsWithDelta(35.0, $fallback->timeouts[0], 0.01);

        $this->assertLessThanOrEqual(
            100.0,
            $primary->timeouts[0] + $fallback->timeouts[0],
            'Gabungan anggaran utama dan cadangan tidak boleh melebihi batas total.',
        );
    }

    public function test_no_fallback_call_when_the_primary_succeeds(): void
    {
        $primary = new RecordingProvider('utama');
        $fallback = new RecordingProvider('cadangan');

        (new FallbackProvider($primary, $fallback))->paragraphsFor('prompt');

        $this->assertCount(1, $primary->timeouts);
        $this->assertCount(0, $fallback->timeouts);
    }

    public function test_the_selector_splits_the_budget_across_providers(): void
    {
        config(['services.ai.total_timeout' => 90]);

        $first = new RecordingProvider('satu', failWith: new ProviderExhaustedException('habis'));
        $second = new RecordingProvider('dua');

        (new ProviderSelector([$first, $second]))->paragraphsFor('prompt');

        $this->assertCount(1, $first->timeouts);
        $this->assertCount(1, $second->timeouts);

        // Dua penyedia: masing-masing kebagian setengah dari 90 detik.
        $this->assertEqualsWithDelta(45.0, $first->timeouts[0], 0.01);
        $this->assertEqualsWithDelta(45.0, $second->timeouts[0], 0.01);
    }

    public function test_an_explicit_budget_overrides_the_configured_total(): void
    {
        config(['services.ai.total_timeout' => 999]);

        $primary = new RecordingProvider('utama');

        (new FallbackProvider($primary, new RecordingProvider('cadangan')))
            ->paragraphsFor('prompt', 10.0);

        $this->assertEqualsWithDelta(6.5, $primary->timeouts[0], 0.01);
    }
}

/**
 * Penyedia palsu yang merekam setiap anggaran waktu yang diterimanya, supaya
 * pembagiannya bisa diperiksa tanpa jaringan maupun penantian nyata.
 */
class RecordingProvider implements AiProvider
{
    /** @var array<int, float|null> */
    public array $timeouts = [];

    public function __construct(
        private readonly string $label,
        private readonly ?RuntimeException $failWith = null,
    ) {}

    public function name(): string
    {
        return $this->label;
    }

    public function model(): string
    {
        return "{$this->label}-model";
    }

    public function isConfigured(): bool
    {
        return true;
    }

    public function paragraphsFor(string $prompt, ?float $timeoutSeconds = null): LlmResult
    {
        $this->timeouts[] = $timeoutSeconds;

        if ($this->failWith !== null) {
            throw $this->failWith;
        }

        return new LlmResult(['jawaban'], TokenUsage::unknown());
    }
}
