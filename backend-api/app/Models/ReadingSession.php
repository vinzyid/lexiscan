<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 */
#[Fillable([
    'reading_document_id', 'condition', 'session_group_id', 'order_index',
    'started_at', 'completed_at', 'duration_seconds', 'words_total',
    'words_correct', 'comprehension_correct', 'comprehension_total',
    'difficulty_rating', 'assessment_method', 'notes',
])]
class ReadingSession extends Model
{
    public const BASELINE = 'baseline';

    public const ASSISTED = 'assisted';

    protected $appends = ['wpm', 'cwpm', 'comprehension_percent', 'accuracy_percent'];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime', 'completed_at' => 'datetime',
            'difficulty_rating' => 'decimal:1',
        ];
    }

    public function reader(): BelongsTo
    {
        return $this->belongsTo(Reader::class);
    }

    public function document(): BelongsTo
    {
        return $this->belongsTo(ReadingDocument::class, 'reading_document_id');
    }

    public function features(): HasMany
    {
        return $this->hasMany(SessionFeature::class);
    }

    public function getWpmAttribute(): ?float
    {
        return self::rate($this->words_total, $this->duration_seconds);
    }

    public function getCwpmAttribute(): ?float
    {
        return self::rate($this->words_correct, $this->duration_seconds);
    }

    public function getComprehensionPercentAttribute(): ?float
    {
        return self::percent($this->comprehension_correct, $this->comprehension_total);
    }

    public function getAccuracyPercentAttribute(): ?float
    {
        return self::percent($this->words_correct, $this->words_total);
    }

    public static function countWords(string $text): int
    {
        preg_match_all('/[^\s]+/u', trim($text), $matches);

        return count($matches[0]);
    }

    private static function rate(?int $value, ?int $seconds): ?float
    {
        return $value !== null && $seconds !== null && $seconds > 0
            ? round($value / ($seconds / 60), 2)
            : null;
    }

    private static function percent(?int $value, ?int $total): ?float
    {
        return $value !== null && $total !== null && $total > 0
            ? round($value / $total * 100, 2)
            : null;
    }

    /** @return array<string, mixed> */
    public function toSummary(): array
    {
        return [
            'id' => $this->id,
            'condition' => $this->condition,
            'session_group_id' => $this->session_group_id,
            'order_index' => $this->order_index,
            'document' => $this->relationLoaded('document') ? $this->document?->toSummary() : null,
            'started_at' => $this->started_at?->toIso8601String(),
            'completed_at' => $this->completed_at?->toIso8601String(),
            'duration_seconds' => $this->duration_seconds,
            'words_total' => $this->words_total,
            'words_correct' => $this->words_correct,
            'wpm' => $this->wpm,
            'cwpm' => $this->cwpm,
            'accuracy_percent' => $this->accuracy_percent,
            'comprehension_correct' => $this->comprehension_correct,
            'comprehension_total' => $this->comprehension_total,
            'comprehension_percent' => $this->comprehension_percent,
            'difficulty_rating' => $this->difficulty_rating,
            'assessment_method' => $this->assessment_method,
            'notes' => $this->notes,
            'features' => $this->relationLoaded('features') ? $this->features->pluck('feature_key')->values() : [],
        ];
    }
}
