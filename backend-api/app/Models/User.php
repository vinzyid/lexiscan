<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Administrator layanan — bukan pengguna aplikasi.
 *
 * LexiScan sengaja tidak punya akun pengguna: formulir masuk menuntut ketepatan
 * mengeja dan mengingat sandi, dua hal yang justru menjadi hambatan bagi
 * penyandang disleksia. Pengguna aplikasi diwakili penanda perangkat anonim,
 * lihat App\Models\Device.
 *
 * Jadi seluruh isi tabel ini adalah tim pengembang yang mengoperasikan layanan,
 * dan tidak ada jalur pendaftaran mandiri — akun hanya dibuat lewat
 * `php artisan make:filament-user`.
 */
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Semua yang ada di tabel ini memang administrator — lihat penjelasan di
     * atas kelas. Kalau suatu saat akun pengguna biasa ikut disimpan di sini,
     * method ini HARUS diganti menjadi pemeriksaan peran, kalau tidak setiap
     * pengguna langsung bisa membuka dashboard admin.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return true;
    }
}
