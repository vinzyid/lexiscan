<?php

namespace App\Filament\Resources\Devices\Tables;

use App\Models\Device;
use Filament\Actions\Action;
use Filament\Forms\Components\Textarea;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class DevicesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('last_seen_at', 'desc')
            ->columns([
                /*
                 * UUID penuh terlalu panjang untuk dibaca sekilas, tapi tetap
                 * harus utuh saat admin perlu mencocokkannya dengan laporan —
                 * karena itu dipendekkan tampilannya saja, dan bisa disalin.
                 */
                TextColumn::make('id')
                    ->label('Penanda perangkat')
                    ->formatStateUsing(fn (string $state): string => substr($state, 0, 8).'…')
                    ->copyable()
                    ->copyMessage('Penanda disalin')
                    ->searchable()
                    ->fontFamily('mono'),

                TextColumn::make('usage_logs_count')
                    ->label('Permintaan')
                    ->counts('usageLogs')
                    ->sortable()
                    ->alignEnd(),

                TextColumn::make('first_seen_at')
                    ->label('Pertama terlihat')
                    ->dateTime('d M Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('last_seen_at')
                    ->label('Terakhir terlihat')
                    ->dateTime('d M Y H:i')
                    ->since()
                    ->sortable(),

                TextColumn::make('blocked_at')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => $state === null ? 'Aktif' : 'Diblokir')
                    ->color(fn (?string $state): string => $state === null ? 'success' : 'danger')
                    ->default(null),

                TextColumn::make('blocked_reason')
                    ->label('Alasan')
                    ->wrap()
                    ->toggleable(),
            ])
            ->filters([
                Filter::make('blocked')
                    ->label('Hanya yang diblokir')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('blocked_at')),
            ])
            ->recordActions([
                self::blockAction(),
                self::unblockAction(),
            ]);
    }

    /**
     * Memblokir perangkat.
     *
     * Alasannya wajib diisi: blokir tanpa catatan tidak bisa ditinjau ulang
     * kemudian, dan orang yang membukanya nanti belum tentu orang yang sama
     * yang memasangnya.
     */
    private static function blockAction(): Action
    {
        return Action::make('block')
            ->label('Blokir')
            ->icon('heroicon-o-no-symbol')
            ->color('danger')
            ->visible(fn (Device $record): bool => ! $record->isBlocked())
            ->schema([
                Textarea::make('reason')
                    ->label('Alasan pemblokiran')
                    ->required()
                    ->maxLength(255)
                    ->placeholder('Contoh: permintaan otomatis beruntun sepanjang malam.'),
            ])
            ->action(function (array $data, Device $record): void {
                $record->update([
                    'blocked_at' => now(),
                    'blocked_reason' => $data['reason'],
                ]);
            })
            ->successNotificationTitle('Perangkat diblokir. Permintaan berikutnya akan ditolak.');
    }

    private static function unblockAction(): Action
    {
        return Action::make('unblock')
            ->label('Buka blokir')
            ->icon('heroicon-o-check-circle')
            ->color('success')
            ->requiresConfirmation()
            ->modalHeading('Buka blokir perangkat ini?')
            ->modalDescription('Perangkat akan langsung bisa memakai fitur AI lagi.')
            ->visible(fn (Device $record): bool => $record->isBlocked())
            ->action(function (Device $record): void {
                $record->update(['blocked_at' => null, 'blocked_reason' => null]);
            })
            ->successNotificationTitle('Blokir dibuka.');
    }
}
