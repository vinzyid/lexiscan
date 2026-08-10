<?php

namespace App\Filament\Resources\Readers\Tables;

use App\Models\Reader;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class ReadersTable
{
    /** Label & warna tiap tingkat kemampuan membaca di kolom badge. */
    private const LEVELS = [
        Reader::LEVEL_BELUM => ['Belum bisa membaca', 'danger'],
        Reader::LEVEL_MENGEJA => ['Masih mengeja', 'warning'],
        Reader::LEVEL_LANCAR => ['Sudah lancar', 'success'],
    ];

    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('name')
                    ->label('Nama')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('username')
                    ->label('Nama pengguna')
                    ->searchable()
                    ->fontFamily('mono')
                    ->toggleable(),

                TextColumn::make('reading_level')
                    ->label('Kemampuan membaca')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => self::LEVELS[$state][0] ?? $state)
                    ->color(fn (string $state): string => self::LEVELS[$state][1] ?? 'gray')
                    ->sortable(),

                /*
                 * Kosong berarti penggunanya belum pernah menyimpang dari
                 * preset level membacanya. Kalau kolom ini banyak terisi,
                 * presetnya yang perlu ditinjau — bukan penggunanya.
                 */
                TextColumn::make('type_level')
                    ->label('Tipografi pilihan sendiri')
                    ->placeholder('mengikuti preset')
                    ->toggleable(),

                TextColumn::make('tts_enabled')
                    ->label('Suara')
                    ->badge()
                    ->placeholder('mengikuti preset')
                    ->formatStateUsing(fn (?bool $state): string => $state ? 'Nyala' : 'Mati')
                    ->color(fn (?bool $state): string => $state ? 'success' : 'gray')
                    ->toggleable(),

                TextColumn::make('created_at')
                    ->label('Mendaftar')
                    ->dateTime('d M Y H:i')
                    ->since()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('reading_level')
                    ->label('Kemampuan membaca')
                    ->options(array_map(fn (array $level): string => $level[0], self::LEVELS)),
            ]);
    }
}
