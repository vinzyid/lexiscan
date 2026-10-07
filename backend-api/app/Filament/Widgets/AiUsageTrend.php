<?php

namespace App\Filament\Widgets;

use App\Models\AiUsageLog;
use Filament\Widgets\ChartWidget;

class AiUsageTrend extends ChartWidget
{
    protected ?string $heading = 'Tren permintaan AI';

    protected ?string $description = 'Permintaan berhasil per hari: bandingkan panggilan model dengan hasil dari simpanan. Hari tanpa aktivitas ditampilkan sebagai nol.';

    protected ?string $maxHeight = '320px';

    protected int|string|array $columnSpan = 'full';

    public ?string $filter = '14';

    protected function getFilters(): ?array
    {
        return ['7' => '7 hari', '14' => '14 hari', '30' => '30 hari'];
    }

    protected function getData(): array
    {
        $days = in_array($this->filter, ['7', '14', '30'], true) ? (int) $this->filter : 14;
        $start = now()->startOfDay()->subDays($days - 1);
        $end = now();
        $counts = AiUsageLog::query()
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('DATE(created_at) as day, cached, COUNT(*) as total')
            ->groupByRaw('DATE(created_at), cached')
            ->get()
            ->keyBy(fn ($row): string => $row->day.'-'.(int) $row->cached);

        $labels = [];
        $model = [];
        $cached = [];

        for ($day = $start->copy(); $day->lte($end); $day->addDay()) {
            $key = $day->format('Y-m-d');
            $labels[] = $day->format('d M');
            $model[] = (int) ($counts->get($key.'-0')?->total ?? 0);
            $cached[] = (int) ($counts->get($key.'-1')?->total ?? 0);
        }

        return [
            'labels' => $labels,
            'datasets' => [
                ['label' => 'Memanggil model', 'data' => $model, 'borderColor' => '#d97706', 'backgroundColor' => '#d9770620', 'tension' => 0.3, 'fill' => true],
                ['label' => 'Dari simpanan', 'data' => $cached, 'borderColor' => '#059669', 'backgroundColor' => '#05966920', 'tension' => 0.3, 'fill' => true],
            ],
        ];
    }

    protected function getOptions(): array
    {
        return ['scales' => ['y' => ['beginAtZero' => true, 'ticks' => ['precision' => 0]]], 'interaction' => ['mode' => 'index', 'intersect' => false]];
    }

    protected function getType(): string
    {
        return 'line';
    }
}
