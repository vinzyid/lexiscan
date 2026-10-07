<?php

namespace App\Filament\Widgets;

use App\Filament\Resources\Feedback\FeedbackResource;
use App\Models\Feedback;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class FeedbackOverview extends StatsOverviewWidget
{
    protected ?string $heading = 'Tindak lanjut pengguna';

    protected function getStats(): array
    {
        $pending = Feedback::pending()->count();
        $ocr = Feedback::pending()->where('type', Feedback::TYPE_OCR_FAILURE)->count();
        $oldest = Feedback::pending()->oldest('created_at')->first();
        $handled = Feedback::where('handled_at', '>=', now()->subDays(7))->count();

        return [
            Stat::make('Laporan belum ditangani', $pending)
                ->description($oldest ? 'Tertua: '.$oldest->created_at->diffForHumans() : 'Semua laporan telah ditangani')
                ->descriptionIcon('heroicon-m-chat-bubble-left-ellipsis')
                ->color($pending > 0 ? 'warning' : 'success')
                ->url(FeedbackResource::getUrl('index', ['filters' => ['handled' => ['value' => '0']]])),
            Stat::make('Kegagalan OCR tertunda', $ocr)
                ->description('Laporan pengguna, bukan tingkat kegagalan otomatis')
                ->descriptionIcon('heroicon-m-document-magnifying-glass')
                ->color($ocr > 0 ? 'danger' : 'success')
                ->url(FeedbackResource::getUrl('index', ['filters' => ['handled' => ['value' => '0'], 'type' => ['value' => Feedback::TYPE_OCR_FAILURE]]])),
            Stat::make('Diselesaikan (7 hari)', $handled)
                ->description('Laporan dengan catatan tindak lanjut')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success')
                ->url(FeedbackResource::getUrl()),
        ];
    }
}
