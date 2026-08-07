<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Satu laporan dari pengguna: masukan umum atau kegagalan OCR.
 *
 * @property int $id
 * @property string|null $device_id
 * @property string $type
 * @property string $message
 * @property string|null $sample
 * @property string|null $app_version
 * @property string|null $platform
 * @property Carbon|null $handled_at
 * @property string|null $handled_note
 * @property Carbon $created_at
 */
class Feedback extends Model
{
    public const TYPE_FEEDBACK = 'feedback';

    public const TYPE_OCR_FAILURE = 'ocr_failure';

    /** Tabelnya 'feedback', bukan 'feedbacks' — kata itu tidak berbentuk jamak. */
    protected $table = 'feedback';

    public const UPDATED_AT = null;

    protected $fillable = [
        'device_id', 'type', 'message', 'sample', 'app_version', 'platform',
        'handled_at', 'handled_note',
    ];

    protected function casts(): array
    {
        return [
            'handled_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function isHandled(): bool
    {
        return $this->handled_at !== null;
    }

    /** @return BelongsTo<Device, $this> */
    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /** @param  Builder<Feedback>  $query */
    public function scopePending(Builder $query): void
    {
        $query->whereNull('handled_at');
    }
}
