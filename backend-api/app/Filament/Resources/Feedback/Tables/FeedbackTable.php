<?php

namespace App\Filament\Resources\Feedback\Tables;

use App\Models\Feedback;
use Filament\Actions\Action;
use Filament\Forms\Components\Textarea;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class FeedbackTable
{
    private const TYPES = [
        Feedback::TYPE_FEEDBACK => 'Masukan',
        Feedback::TYPE_OCR_FAILURE => 'Kegagalan OCR',
    ];

    public static function configure(Table $table): Table
    {
        return $table
            // Yang belum ditangani naik ke atas: itu yang perlu dikerjakan.
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('created_at')
                    ->label('Masuk')
                    ->dateTime('d M Y H:i')
                    ->since()
                    ->sortable(),

                TextColumn::make('type')
                    ->label('Jenis')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => self::TYPES[$state] ?? $state)
                    ->color(fn (string $state): string => $state === Feedback::TYPE_OCR_FAILURE ? 'danger' : 'info'),

                TextColumn::make('message')
                    ->label('Isi laporan')
                    ->wrap()
                    ->limit(160)
                    ->searchable(),

                TextColumn::make('sample')
                    ->label('Contoh teks')
                    ->wrap()
                    ->limit(120)
                    ->placeholder('Tidak disertakan')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('platform')
                    ->label('Platform')
                    ->placeholder('—')
                    ->toggleable(),

                TextColumn::make('app_version')
                    ->label('Versi')
                    ->placeholder('—')
                    ->toggleable(),

                TextColumn::make('device_id')
                    ->label('Perangkat')
                    ->formatStateUsing(fn (?string $state): string => $state === null ? 'Tanpa penanda' : substr($state, 0, 8).'…')
                    ->fontFamily('mono')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('handled_at')
                    ->label('Status')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => $state === null ? 'Belum ditangani' : 'Selesai')
                    ->color(fn (?string $state): string => $state === null ? 'warning' : 'success')
                    ->default(null),
            ])
            ->filters([
                SelectFilter::make('type')
                    ->label('Jenis')
                    ->options(self::TYPES),

                TernaryFilter::make('handled')
                    ->label('Status')
                    ->placeholder('Semua')
                    ->trueLabel('Sudah ditangani')
                    ->falseLabel('Belum ditangani')
                    ->queries(
                        true: fn (Builder $query): Builder => $query->whereNotNull('handled_at'),
                        false: fn (Builder $query): Builder => $query->whereNull('handled_at'),
                        blank: fn (Builder $query): Builder => $query,
                    ),
            ])
            ->recordActions([
                self::handleAction(),
                self::reopenAction(),
            ]);
    }

    /**
     * Menandai laporan sudah ditindaklanjuti.
     *
     * Catatannya wajib: laporan yang ditutup tanpa keterangan tidak bisa
     * dibedakan dari yang sekadar diabaikan, dan orang berikutnya yang
     * membukanya tidak punya cara tahu apa yang sudah dikerjakan.
     */
    private static function handleAction(): Action
    {
        return Action::make('handle')
            ->label('Tandai selesai')
            ->icon('heroicon-o-check')
            ->color('success')
            ->visible(fn (Feedback $record): bool => ! $record->isHandled())
            ->schema([
                Textarea::make('note')
                    ->label('Tindak lanjut')
                    ->required()
                    ->maxLength(1000)
                    ->placeholder('Contoh: OCR gagal pada buku cetak tipis, sudah ditambahkan ke daftar uji.'),
            ])
            ->action(function (array $data, Feedback $record): void {
                $record->update(['handled_at' => now(), 'handled_note' => $data['note']]);
            })
            ->successNotificationTitle('Laporan ditandai selesai.');
    }

    private static function reopenAction(): Action
    {
        return Action::make('reopen')
            ->label('Buka lagi')
            ->icon('heroicon-o-arrow-uturn-left')
            ->color('gray')
            ->requiresConfirmation()
            ->visible(fn (Feedback $record): bool => $record->isHandled())
            ->action(fn (Feedback $record) => $record->update(['handled_at' => null, 'handled_note' => null]))
            ->successNotificationTitle('Laporan dibuka lagi.');
    }
}
