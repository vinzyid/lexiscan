<?php

namespace App\Filament\Actions;

use App\Models\Reader;
use App\Models\User;
use App\Services\AccountManagement;
use Filament\Actions\Action;
use Filament\Forms\Components\TextInput;

class AccountActions
{
    public static function make(): array
    {
        return [
            Action::make('toggleActive')
                ->label(fn (User|Reader $record): string => $record->is_active ? 'Nonaktifkan' : 'Aktifkan')
                ->requiresConfirmation()
                ->disabled(fn (User|Reader $record): bool => $record instanceof User && ($record->is(auth()->user()) || ($record->is_active && User::where('is_active', true)->count() <= 1)))
                ->schema([TextInput::make('current_password')->label('Kata sandi administrator')->password()->required()])
                ->action(fn (User|Reader $record, array $data) => app(AccountManagement::class)->setActive(auth()->user(), $record, ! $record->is_active, $data['current_password'])),
            Action::make('resetPassword')
                ->label('Reset kata sandi')
                ->requiresConfirmation()
                ->modalDescription('Verifikasi identitas pemilik akun sebelum melanjutkan. Semua sesi akan dicabut. Sampaikan kata sandi baru melalui saluran pribadi yang terverifikasi.')
                ->schema([
                    TextInput::make('current_password')->label('Kata sandi administrator')->password()->required(),
                    TextInput::make('password')->label('Kata sandi baru')->password()->required()->minLength(fn (User|Reader $record): int => $record instanceof User ? 12 : 6)->maxLength(72)->confirmed(),
                    TextInput::make('password_confirmation')->label('Konfirmasi kata sandi baru')->password()->required(),
                ])
                ->action(fn (User|Reader $record, array $data) => app(AccountManagement::class)->resetPassword(auth()->user(), $record, $data['current_password'], $data['password'], $data['password_confirmation'])),
        ];
    }
}
