<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Goal belajar pengguna.
 *
 * `metric_key` menentukan bagaimana kemajuan dihitung, dan arahnya berbeda
 * per metrik: pemahaman naik itu maju, sementara rating kesulitan turun itu
 * maju. Karena itu tidak ada satu rumus yang dipakai untuk semuanya.
 */
/**
 * @property Carbon|null $starts_at
 * @property Carbon|null $target_date
 */
#[Fillable([
    'title', 'description', 'metric_key', 'baseline_value', 'target_value',
    'unit', 'starts_at', 'target_date', 'status', 'notes',
])]
class ReadingGoal extends Model
{
    public const METRIC_SESSION_COUNT = 'session_count';

    public const METRIC_COMPREHENSION = 'comprehension_percent';

    public const METRIC_DIFFICULTY = 'difficulty_rating';

    public const METRIC_WPM = 'wpm';

    public const METRIC_CWPM = 'cwpm';

    public const METRIC_DURATION = 'duration_seconds';

    public const METRIC_ACCURACY = 'accuracy_percent';

    public const STATUS_NOT_STARTED = 'not_started';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_ACHIEVED = 'achieved';

    public const STATUS_STOPPED = 'stopped';

    /** Metrik yang makin rendah makin baik. */
    public const LOWER_IS_BETTER = [self::METRIC_DIFFICULTY, self::METRIC_DURATION];

    protected $appends = ['is_lower_better'];

    protected function casts(): array
    {
        return [
            'baseline_value' => 'decimal:2',
            'target_value' => 'decimal:2',
            'starts_at' => 'date',
            'target_date' => 'date',
        ];
    }

    public function reader(): BelongsTo
    {
        return $this->belongsTo(Reader::class);
    }

    public function getIsLowerBetterAttribute(): bool
    {
        return in_array($this->metric_key, self::LOWER_IS_BETTER, true);
    }

    /**
     * Kemajuan menuju target, 0-100 untuk bilah, tapi `actual` menyimpan nilai
     * mentahnya supaya target yang terlampaui tidak tampak berhenti di 100.
     *
     * @return array{actual: float|null, percent: float|null, achieved: bool, unit: string}
     */
    public function progress(?float $actual): array
    {
        $unit = $this->unit;
        $base = $this->baseline_value !== null ? (float) $this->baseline_value : null;
        $target = (float) $this->target_value;

        if ($actual === null) {
            return ['actual' => null, 'percent' => null, 'achieved' => false, 'unit' => $unit];
        }

        $achieved = $this->is_lower_better ? $actual <= $target : $actual >= $target;
        $start = $base ?? 0.0;
        $span = $target - $start;

        if (abs($span) < 1e-9) {
            return ['actual' => round($actual, 2), 'percent' => $achieved ? 100.0 : 0.0, 'achieved' => $achieved, 'unit' => $unit];
        }

        $ratio = ($actual - $start) / $span;
        $percent = max(0.0, min(100.0, round($ratio * 100, 2)));

        /*
         * Target yang terlampaui tetap dianggap 100% untuk bilahnya, tapi
         * nilainya sendiri disimpan mentah — supaya "6 dari 4 sesi" tidak
         * terbaca sebagai tepat pas empat.
         */
        if ($achieved) {
            $percent = 100.0;
        }

        return ['actual' => round($actual, 2), 'percent' => $percent, 'achieved' => $achieved, 'unit' => $unit];
    }

    /** @return array<string, mixed> */
    public function toSummary(?float $actual = null): array
    {
        $progress = $this->progress($actual);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'metric_key' => $this->metric_key,
            'baseline_value' => $this->baseline_value !== null ? (float) $this->baseline_value : null,
            'target_value' => (float) $this->target_value,
            'unit' => $this->unit,
            'starts_at' => $this->starts_at?->toDateString(),
            'target_date' => $this->target_date?->toDateString(),
            'status' => $this->status,
            'notes' => $this->notes,
            'is_lower_better' => $this->is_lower_better,
            'actual' => $progress['actual'],
            'percent' => $progress['percent'],
            'achieved' => $progress['achieved'],
        ];
    }
}
