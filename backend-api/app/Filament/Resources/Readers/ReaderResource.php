<?php

namespace App\Filament\Resources\Readers;

use App\Filament\Resources\Readers\Pages\ListReaders;
use App\Filament\Resources\Readers\Tables\ReadersTable;
use App\Models\Reader;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

/**
 * Akun pengguna aplikasi, hanya untuk dilihat.
 *
 * Tidak ada halaman buat maupun sunting, dan itu disengaja. Pendaftaran
 * dirancang untuk dilakukan anak bersama guru atau orang tuanya di aplikasi —
 * di sanalah kemampuan membacanya dinilai. Admin yang menyetel `reading_level`
 * dari kursinya sendiri berarti menebak, dan tebakan itu langsung mengubah
 * ukuran huruf serta suara di HP seseorang.
 *
 * Gunanya di sini: melihat sebaran kemampuan membaca pengguna, yang menjadi
 * bahan evaluasi apakah preset tipografinya sudah tepat sasaran.
 */
class ReaderResource extends Resource
{
    protected static ?string $model = Reader::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserGroup;

    protected static string|UnitEnum|null $navigationGroup = 'Operasional';

    protected static ?string $modelLabel = 'Pengguna';

    protected static ?string $pluralModelLabel = 'Pengguna';

    protected static ?int $navigationSort = 3;

    public static function table(Table $table): Table
    {
        return ReadersTable::configure($table);
    }

    public static function getNavigationBadge(): ?string
    {
        $total = Reader::count();

        return $total > 0 ? (string) $total : null;
    }

    public static function getPages(): array
    {
        return [
            'index' => ListReaders::route('/'),
        ];
    }
}
