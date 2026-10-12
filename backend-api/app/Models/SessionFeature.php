<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['feature_key', 'settings_snapshot'])]
class SessionFeature extends Model
{
    public $timestamps = false;

    protected function casts(): array
    {
        return ['settings_snapshot' => 'array'];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ReadingSession::class, 'reading_session_id');
    }
}
