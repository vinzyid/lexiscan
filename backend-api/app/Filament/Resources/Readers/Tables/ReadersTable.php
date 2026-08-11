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

    /** Label tiap jenjang sekolah; urutannya sama dengan kartu di aplikasi. */
    private const SCHOOLS = [
        Reader::SCHOOL_SD1 => 'SD Kelas 1–3',
        Reader::SCHOOL_SD2 => 'SD Kelas 4–6',
        Reader::SCHOOL_SMP => 'SMP',
        Reader::SCHOOL_SMA => 'SMA',
        Reader::SCHOOL_UMUM => 'Umum',
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
                 * Kosong untuk akun yang mendaftar sebelum pertanyaan jenjang
                 * ada. Sengaja tidak diisi nilai tebakan — lihat migrasi
                 * add_school_level_to_readers_table.
                 */
                TextColumn::make('school_level')
                    ->label('Jenjang')
                    ->badge()
                    ->placeholder('belum ditanyakan')
                    ->formatStateUsing(fn (string $state): string => self::SCHOOLS[$state] ?? $state)
                    ->color('info')
                    ->toggleable(),

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

                SelectFilter::make('school_level')
                    ->label('Jenjang')
                    ->options(self::SCHOOLS),
            ]);
    }
}
