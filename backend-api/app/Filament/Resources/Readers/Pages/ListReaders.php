<?php

namespace App\Filament\Resources\Readers\Pages;

use App\Filament\Resources\Readers\ReaderResource;
use Filament\Resources\Pages\ListRecords;

class ListReaders extends ListRecords
{
    protected static string $resource = ReaderResource::class;

    /** Tanpa tombol "buat": akun dibuat sendiri dari aplikasi saat mendaftar. */
    protected function getHeaderActions(): array
    {
        return [];
    }
}
