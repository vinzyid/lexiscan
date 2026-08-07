<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Satu permintaan AI yang sudah dilayani. Append-only: baris yang sudah ditulis
 * tidak pernah diubah, sehingga laporan konsumsi bisa dipercaya.
 *
 * @property int $id
 * @property string|null $device_id
 * @property string $feature
 * @property string|null $variant
 * @property string $language
 * @property string $provider
 * @property string $model
 * @property bool $cached
 * @property int $input_tokens
 * @property int $output_tokens
 * @property string $energy_wh
 * @property string $co2e_g
 * @property string $avoided_energy_wh
 * @property string $avoided_co2e_g
 * @property int|null $duration_ms
 * @property Carbon $created_at
 */
class AiUsageLog extends Model
{
    public const FEATURE_SIMPLIFY = 'simplify';

    public const FEATURE_EXPLAIN = 'explain';

    public const FEATURE_CORRECT_TYPO = 'correct_typo';

    /** Log tidak pernah disunting, jadi kolom updated_at hanya beban. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'device_id', 'feature', 'variant', 'language', 'provider', 'model', 'cached',
        'input_tokens', 'output_tokens', 'energy_wh', 'co2e_g',
        'avoided_energy_wh', 'avoided_co2e_g', 'duration_ms',
    ];

    protected function casts(): array
    {
        return [
            'cached' => 'boolean',
            'created_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<Device, $this> */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Permintaan yang benar-benar menjalankan model — satu-satunya yang memakai
     * kuota berbayar dan mengeluarkan emisi.
     *
     * @param  Builder<AiUsageLog>  $query
     */
    public function scopeBilled(Builder $query): void
    {
        $query->where('cached', false);
    }
}
