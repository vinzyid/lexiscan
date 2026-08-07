<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Pembaca parameter sistem yang bisa diubah admin dari dashboard.
 *
 * Aturannya satu: nilai bawaan ada di kode, tabel `settings` hanya menimpanya.
 * Karena itu layanan tetap berjalan benar saat tabelnya kosong maupun saat
 * databasenya sedang tidak terjangkau — kegagalan membaca dicatat lalu nilai
 * bawaan yang dipakai, bukan permintaan pengguna yang dijatuhkan.
 */
class SystemSettings
{
    public const KEY_SIMPLIFY_RULES = 'simplify_rules';

    public const KEY_EXPLAIN_STYLES = 'explain_styles';

    public const KEY_TYPOGRAPHY = 'typography';

    private const CACHE_KEY = 'settings:all';

    /**
     * Dibaca berkali-kali dalam satu permintaan, jadi sekali ambil sudah cukup.
     *
     * Sengaja properti instance dan BUKAN static: kelas ini didaftarkan sebagai
     * singleton, sehingga umurnya sudah selesai bersama permintaannya. Memo
     * static akan bertahan melewati batas itu — di test dan di worker yang
     * berumur panjang seperti Octane, suntingan admin tidak akan pernah terlihat
     * sampai prosesnya dimulai ulang.
     *
     * @var array<string, mixed>|null
     */
    private ?array $memo = null;

    /**
     * Nilai satu parameter, sudah digabung dengan bawaannya.
     *
     * @param  array<string, mixed>  $default
     * @return array<string, mixed>
     */
    public function get(string $key, array $default): array
    {
        $stored = $this->all()[$key] ?? null;

        if (! is_array($stored)) {
            return $default;
        }

        /*
         * Gabungan rekursif, bukan penggantian: kalau admin baru menyunting
         * aturan L3 bahasa Indonesia, level dan bahasa lain harus tetap memakai
         * bawaannya — bukan menjadi kosong.
         */
        return array_replace_recursive($default, $stored);
    }

    /** @param  array<string, mixed>  $value */
    public function put(string $key, array $value): void
    {
        Setting::updateOrCreate(['key' => $key], ['value' => $value, 'updated_at' => now()]);

        $this->forget();
    }

    public function forget(): void
    {
        $this->memo = null;

        try {
            Cache::forget(self::CACHE_KEY);
        } catch (Throwable) {
            // Store yang mati tidak perlu diributkan: pembacaan berikutnya
            // toh akan jatuh ke database, lalu ke nilai bawaan.
        }
    }

    /** @return array<string, mixed> */
    private function all(): array
    {
        if ($this->memo !== null) {
            return $this->memo;
        }

        try {
            $rows = Cache::remember(
                self::CACHE_KEY,
                300,
                fn (): array => Setting::query()->pluck('value', 'key')->all(),
            );
        } catch (Throwable $e) {
            Log::warning('Parameter sistem gagal dibaca, memakai nilai bawaan.', [
                'error' => $e->getMessage(),
            ]);

            $rows = [];
        }

        return $this->memo = is_array($rows) ? $rows : [];
    }
}
