<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Satu parameter sistem yang sudah diubah admin dari nilai bawaannya.
 *
 * Lihat App\Services\SystemSettings untuk cara membacanya — jangan mengambil
 * model ini langsung dari tempat lain, karena di situlah nilai bawaan dan
 * penanganan database yang bermasalah diurus.
 *
 * @property string $key
 * @property mixed $value
 */
class Setting extends Model
{
    protected $primaryKey = 'key';

    protected $keyType = 'string';

    public $incrementing = false;

    public const CREATED_AT = null;

    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return [
            'value' => 'array',
            'updated_at' => 'datetime',
        ];
    }
}
