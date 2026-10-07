<?php

namespace App\Filament\Pages;

use App\Filament\Widgets\AiUsageOverview;
use App\Filament\Widgets\AiUsageTrend;
use App\Filament\Widgets\FeedbackOverview;
use App\Filament\Widgets\ServiceHealthOverview;
use Filament\Pages\Dashboard as BaseDashboard;

class Dashboard extends BaseDashboard
{
    protected static ?string $title = 'Ringkasan LexiScan';

    protected static ?string $navigationLabel = 'Ringkasan';

    public function getSubheading(): ?string
    {
        return 'Pantau penggunaan AI, kesehatan layanan, dan laporan yang perlu ditindaklanjuti.';
    }

    public function getWidgets(): array
    {
        return [AiUsageOverview::class, AiUsageTrend::class, FeedbackOverview::class, ServiceHealthOverview::class];
    }
}
