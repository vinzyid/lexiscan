<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Perangkat anonim yang memakai LexiScan. Bukan akun pengguna — lihat alasannya
 * di migrasi create_devices_table.
 *
 * @property string $id
 * @property Carbon $first_seen_at
 * @property Carbon $last_seen_at
 * @property Carbon|null $blocked_at
 * @property string|null $blocked_reason
 * @property string|null $note
 */
class Device extends Model
{
    /** UUID-nya datang dari aplikasi, bukan dibangkitkan database. */
    protected $keyType = 'string';

    public $incrementing = false;

    /** Tabelnya hanya memakai first_seen_at/last_seen_at, bukan pasangan bawaan. */
    public $timestamps = false;

    protected $fillable = ['id', 'first_seen_at', 'last_seen_at', 'blocked_at', 'blocked_reason', 'note'];

    protected function casts(): array
    {
        return [
            'first_seen_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'blocked_at' => 'datetime',
        ];
    }

    public function isBlocked(): bool
    {
        return $this->blocked_at !== null;
    }

    /** @return HasMany<AiUsageLog, $this> */
    public function usageLogs(): HasMany
    {
        return $this->hasMany(AiUsageLog::class);
    }
}
