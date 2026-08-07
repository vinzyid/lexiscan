<?php

namespace App\Filament\Resources\Feedback;

use App\Filament\Resources\Feedback\Pages\ListFeedback;
use App\Filament\Resources\Feedback\Tables\FeedbackTable;
use App\Models\Feedback;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

/**
 * Masukan pengguna dan laporan kegagalan OCR.
 *
 * Kegagalan OCR tidak bisa dideteksi sendiri oleh server — pengenalan teks
 * berjalan di perangkat dan hasilnya tidak pernah dikirim. Laporan di sini
 * satu-satunya jendela tim ke bagian aplikasi itu.
 */
class FeedbackResource extends Resource
{
    protected static ?string $model = Feedback::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedChatBubbleLeftEllipsis;

    protected static string|UnitEnum|null $navigationGroup = 'Operasional';

    protected static ?string $modelLabel = 'Umpan balik';

    protected static ?string $pluralModelLabel = 'Umpan balik';

    protected static ?int $navigationSort = 4;

    public static function table(Table $table): Table
    {
        return FeedbackTable::configure($table);
    }

    /** Yang belum ditangani, karena itu alasan halaman ini dibuka. */
    public static function getNavigationBadge(): ?string
    {
        $pending = Feedback::pending()->count();

        return $pending > 0 ? (string) $pending : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'warning';
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListFeedback::route('/'),
        ];
    }
}
