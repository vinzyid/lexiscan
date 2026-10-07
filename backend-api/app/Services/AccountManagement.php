<?php

namespace App\Services;

use App\Models\Reader;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AccountManagement
{
    public function setActive(User $actor, User|Reader $account, bool $active, string $currentPassword): void
    {
        DB::transaction(function () use ($actor, $account, $active, $currentPassword): void {
            $admins = User::query()->orderBy('id')->lockForUpdate()->get();
            $this->authorize($admins->find($actor->id), $currentPassword);
            $target = $account instanceof User ? $admins->find($account->id) : Reader::query()->lockForUpdate()->findOrFail($account->id);

            if (! $active && $target instanceof User) {
                if ($target->is($actor) || ($target->is_active && $admins->where('is_active', true)->count() <= 1)) {
                    throw ValidationException::withMessages(['account' => 'Tidak dapat menonaktifkan diri sendiri atau administrator aktif terakhir.']);
                }
            }

            $target->forceFill(['is_active' => $active])->save();
            if (! $active) {
                $this->revoke($target);
            }
        });
    }

    public function resetPassword(User $actor, User|Reader $account, string $currentPassword, string $password, string $confirmation): void
    {
        Validator::make(['password' => $password, 'password_confirmation' => $confirmation], [
            'password' => ['required', 'string', 'min:'.($account instanceof User ? 12 : 6), 'max:72', 'confirmed'],
        ])->validate();

        DB::transaction(function () use ($actor, $account, $currentPassword, $password): void {
            $admins = User::query()->orderBy('id')->lockForUpdate()->get();
            $this->authorize($admins->find($actor->id), $currentPassword);
            $target = $account instanceof User ? $admins->find($account->id) : Reader::query()->lockForUpdate()->findOrFail($account->id);
            $target->forceFill(['password' => $password])->save();
            $this->revoke($target);
        });
    }

    private function authorize(?User $actor, string $password): void
    {
        abort_unless($actor?->is_active, 403);
        if (! Hash::check($password, $actor->password)) {
            throw ValidationException::withMessages(['current_password' => 'Kata sandi administrator tidak cocok.']);
        }
    }

    private function revoke(User|Reader $account): void
    {
        $account->tokens()->delete();
        if ($account instanceof User) {
            $account->forceFill(['remember_token' => Str::random(60)])->save();
            DB::table('sessions')->where('user_id', $account->id)->delete();
        }
    }
}
