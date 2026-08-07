<?php

namespace App\Filament\Resources\AiUsageLogs\Tables;

use App\Models\AiUsageLog;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class AiUsageLogsTable
{
    /** Label yang dibaca admin; nilainya mengikuti konstanta di model. */
    private const FEATURES = [
        AiUsageLog::FEATURE_SIMPLIFY => 'Sederhanakan',
        AiUsageLog::FEATURE_EXPLAIN => 'Jelaskan',
        AiUsageLog::FEATURE_CORRECT_TYPO => 'Perbaiki OCR',
    ];

    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('created_at')
                    ->label('Waktu')
                    ->dateTime('d M Y H:i:s')
                    ->sortable(),

                TextColumn::make('feature')
                    ->label('Fitur')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => self::FEATURES[$state] ?? $state),

                TextColumn::make('variant')
                    ->label('Varian')
                    ->placeholder('—'),

                TextColumn::make('device_id')
                    ->label('Perangkat')
                    ->formatStateUsing(fn (?string $state): string => $state === null ? 'Tanpa penanda' : substr($state, 0, 8).'…')
                    ->fontFamily('mono')
                    ->searchable(),

                IconColumn::make('cached')
                    ->label('Dari simpanan')
                    ->boolean()
                    ->trueIcon('heroicon-o-bolt-slash')
                    ->falseIcon('heroicon-o-bolt')
                    ->trueColor('success')
                    ->falseColor('warning'),

                TextColumn::make('input_tokens')
                    ->label('Token masuk')
                    ->numeric()
                    ->alignEnd()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('output_tokens')
                    ->label('Token keluar')
                    ->numeric()
                    ->alignEnd()
                    ->toggleable(isToggledHiddenByDefault: true),

                /*
                 * Miligram, bukan gram: satu permintaan sekitar 0,03 gram, dan
                 * kolom penuh "0,03" tidak terbaca sebagai perbedaan apa pun.
                 */
                TextColumn::make('co2e_g')
                    ->label('Emisi')
                    ->formatStateUsing(fn (string $state): string => number_format((float) $state * 1000, 1, ',', '.').' mg')
                    ->alignEnd()
                    ->sortable(),

                TextColumn::make('avoided_co2e_g')
                    ->label('Dihindari')
                    ->formatStateUsing(fn (string $state): string => number_format((float) $state * 1000, 1, ',', '.').' mg')
                    ->color('success')
                    ->alignEnd()
                    ->sortable(),

                TextColumn::make('duration_ms')
                    ->label('Latensi')
                    ->formatStateUsing(fn (?int $state): string => $state === null ? '—' : number_format($state / 1000, 2, ',', '.').' dtk')
                    ->alignEnd()
                    ->sortable(),

                TextColumn::make('provider')
                    ->label('Penyedia')
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('model')
                    ->label('Model')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('feature')
                    ->label('Fitur')
                    ->options(self::FEATURES),

                SelectFilter::make('provider')
                    ->label('Penyedia')
                    ->options(fn (): array => AiUsageLog::query()
                        ->distinct()
                        ->pluck('provider', 'provider')
                        ->all()),

                TernaryFilter::make('cached')
                    ->label('Dari simpanan')
                    ->trueLabel('Hanya yang dari simpanan')
                    ->falseLabel('Hanya yang memanggil model'),
            ]);
    }
}
