<?php

namespace App\Filament\Resources\Devices;

use App\Filament\Resources\Devices\Pages\ListDevices;
use App\Filament\Resources\Devices\Tables\DevicesTable;
use App\Models\Device;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use UnitEnum;

/**
 * Perangkat anonim yang memakai LexiScan.
 *
 * Tidak ada halaman buat maupun sunting: perangkat mendaftarkan dirinya sendiri
 * saat pertama memakai layanan, dan satu-satunya tindakan yang masuk akal bagi
 * admin adalah memblokir atau membukanya kembali. Menyunting UUID-nya dengan
 * tangan hanya akan memutus hubungannya dengan riwayat pemakaian.
 */
class DeviceResource extends Resource
{
    protected static ?string $model = Device::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedDevicePhoneMobile;

    protected static string|UnitEnum|null $navigationGroup = 'Operasional';

    protected static ?string $modelLabel = 'Perangkat';

    protected static ?string $pluralModelLabel = 'Perangkat';

    protected static ?int $navigationSort = 2;

    public static function table(Table $table): Table
    {
        return DevicesTable::configure($table);
    }

    /** Angka di samping menu: perangkat yang sedang diblokir, karena itu yang perlu ditengok. */
    public static function getNavigationBadge(): ?string
    {
        $blocked = Device::whereNotNull('blocked_at')->count();

        return $blocked > 0 ? (string) $blocked : null;
    }

    public static function getNavigationBadgeColor(): ?string
    {
        return 'danger';
    }

    public static function getPages(): array
    {
        return [
            'index' => ListDevices::route('/'),
        ];
    }
}
