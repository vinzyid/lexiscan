<?php

namespace App\Filament\Resources\AiUsageLogs;

use App\Filament\Resources\AiUsageLogs\Pages\ListAiUsageLogs;
use App\Filament\Resources\AiUsageLogs\Tables\AiUsageLogsTable;
use App\Models\AiUsageLog;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

/**
 * Riwayat pemakaian AI, hanya bisa dibaca.
 *
 * Sengaja tidak bisa disunting maupun dihapus lewat dashboard: begitu catatan
 * konsumsi bisa diubah dengan tangan, ia berhenti menjadi bukti dan laporan
 * kuota maupun jejak karbon kehilangan artinya.
 */
class AiUsageLogResource extends Resource
{
    protected static ?string $model = AiUsageLog::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedListBullet;

    protected static string|UnitEnum|null $navigationGroup = 'Operasional';

    protected static ?string $modelLabel = 'Riwayat pemakaian';

    protected static ?string $pluralModelLabel = 'Riwayat pemakaian';

    protected static ?int $navigationSort = 3;

    public static function table(Table $table): Table
    {
        return AiUsageLogsTable::configure($table);
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListAiUsageLogs::route('/'),
        ];
    }
}
