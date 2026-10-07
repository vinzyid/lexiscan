<?php

namespace Tests\Feature;

use App\Filament\Pages\Dashboard;
use App\Filament\Resources\Feedback\Pages\ListFeedback;
use App\Filament\Widgets\AiUsageTrend;
use App\Filament\Widgets\FeedbackOverview;
use App\Models\AiUsageLog;
use App\Models\Feedback;
use App\Models\User;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class DashboardFeedbackTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Filament::setCurrentPanel(Filament::getPanel('admin'));
        $this->actingAs(User::factory()->create());
    }

    public function test_dashboard_renders_operational_widgets_without_generic_branding(): void
    {
        Livewire::test(Dashboard::class)
            ->assertSee('Ringkasan LexiScan')
            ->assertSee('Pantau penggunaan AI')
            ->assertDontSee('FilamentInfoWidget');
        Livewire::test(AiUsageTrend::class)->assertSee('Tren permintaan AI');
        Livewire::test(FeedbackOverview::class)->assertSee('Laporan belum ditangani');
    }

    public function test_chart_zero_fills_days_and_separates_model_calls_from_cache_hits(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(12));
        foreach ([false, true, true] as $cached) {
            AiUsageLog::create(['feature' => 'simplify', 'language' => 'id', 'provider' => 'test', 'model' => 'test', 'cached' => $cached]);
        }
        $chart = new class extends AiUsageTrend
        {
            public function data(): array
            {
                return $this->getData();
            }
        };
        $chart->filter = '7';
        $data = $chart->data();
        $this->assertCount(7, $data['labels']);
        $this->assertSame([0, 0, 0, 0, 0, 0, 1], $data['datasets'][0]['data']);
        $this->assertSame([0, 0, 0, 0, 0, 0, 2], $data['datasets'][1]['data']);
    }

    public function test_pending_reports_sort_first_and_detail_has_full_text_and_handled_note(): void
    {
        $pending = Feedback::create(['type' => 'ocr_failure', 'message' => str_repeat('Laporan lengkap ', 30), 'sample' => str_repeat('Contoh OCR ', 30)]);
        $pending->forceFill(['created_at' => now()->subDays(2)])->save();
        $handled = Feedback::create(['type' => 'feedback', 'message' => 'Laporan selesai', 'handled_at' => now(), 'handled_note' => 'Sudah diperbaiki dan diuji.']);
        Livewire::test(ListFeedback::class)
            ->assertCanSeeTableRecords([$pending, $handled], inOrder: true)
            ->mountTableAction('detail', $pending)
            ->assertTableActionDataSet(['message' => $pending->message, 'sample' => $pending->sample]);
        Livewire::test(ListFeedback::class)
            ->mountTableAction('detail', $handled)
            ->assertTableActionDataSet(['handled_note' => $handled->handled_note]);
    }

    public function test_handling_requires_note_and_reopening_clears_resolution(): void
    {
        $report = Feedback::create(['type' => 'ocr_failure', 'message' => 'Tidak ada teks terbaca.']);
        Livewire::test(ListFeedback::class)
            ->callTableAction('handle', $report, data: ['note' => ''])
            ->assertHasTableActionErrors(['note' => 'required']);
        $this->assertNull($report->fresh()->handled_at);
        Livewire::test(ListFeedback::class)
            ->callTableAction('handle', $report, data: ['note' => 'Ditambahkan ke pengujian OCR.'])
            ->assertHasNoTableActionErrors();
        $this->assertNotNull($report->fresh()->handled_at);
        Livewire::test(ListFeedback::class)->callTableAction('reopen', $report);
        $this->assertNull($report->fresh()->handled_at);
        $this->assertNull($report->fresh()->handled_note);
    }
}
