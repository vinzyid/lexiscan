<?php

namespace Tests\Unit;

use App\Services\Ai\ExecutionBudget;
use Tests\TestCase;

/**
 * Anggaran waktu AI harus menghormati batas eksekusi PHP.
 *
 * Regresi yang dijaga di sini nyata: server forvinzy punya max_execution_time
 * 30 detik, sementara AI_TOTAL_TIMEOUT 60 detik. Rantai penyedia yang lambat
 * melewati batas PHP dan prosesnya dibunuh di tengah jalan — pengguna melihat
 * 500 "server error" padahal provider AI-nya cuma belum selesai menjawab.
 */
class ExecutionBudgetTest extends TestCase
{
    public function test_it_uses_the_configured_total_when_php_has_no_limit(): void
    {
        config(['services.ai.total_timeout' => 60]);

        // 0 = tanpa batas (khas mesin pengembang dan sebagian setup FrankenPHP).
        $this->assertSame(60.0, ExecutionBudget::secondsFor(0));
    }

    public function test_it_stays_below_the_php_limit(): void
    {
        // Batas 30 detik dengan anggaran 60: yang berlaku adalah batas PHP minus
        // jeda keamanan, bukan AI_TOTAL_TIMEOUT.
        config(['services.ai.total_timeout' => 60]);

        $budget = ExecutionBudget::secondsFor(30);

        $this->assertLessThan(30.0, $budget, 'Anggaran harus di bawah batas PHP.');
        $this->assertSame(27.0, $budget);
    }

    public function test_the_configured_total_wins_when_it_is_the_tighter_limit(): void
    {
        // Batas PHP longgar (120), tetapi AI_TOTAL_TIMEOUT yang lebih ketat tetap
        // dihormati — tidak melampaui janji ke aplikasi mobile.
        config(['services.ai.total_timeout' => 45]);

        $this->assertSame(45.0, ExecutionBudget::secondsFor(120));
    }

    public function test_it_never_returns_a_uselessly_small_budget(): void
    {
        // Batas PHP sangat ketat: lebih baik mencoba dengan anggaran minimum
        // daripada menolak setiap permintaan tanpa alasan yang jelas.
        config(['services.ai.total_timeout' => 60]);

        $this->assertGreaterThan(0.0, ExecutionBudget::secondsFor(4));
    }
}
