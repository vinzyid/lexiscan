<?php

namespace App\Filament\Resources\Users;

use App\Filament\Actions\AccountActions;
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Models\User;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use UnitEnum;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static ?string $modelLabel = 'Administrator';

    protected static ?string $pluralModelLabel = 'Administrator';

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedShieldCheck;

    protected static string|UnitEnum|null $navigationGroup = 'Pengaturan';

    protected static ?int $navigationSort = 2;

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('name')->label('Nama')->searchable(),
            TextColumn::make('email')->searchable(),
            IconColumn::make('is_active')->label('Aktif')->boolean(),
        ])->recordActions(AccountActions::make());
    }

    public static function getPages(): array
    {
        return ['index' => ListUsers::route('/')];
    }
}
