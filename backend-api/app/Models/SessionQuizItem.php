<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Satu soal kuis pemahaman pada sebuah sesi.
 *
 * `correct_option` adalah kunci yang dinilai benar; `chosen_option` adalah
 * pilihan pembaca. Keduanya disimpan supaya skor bisa ditinjau ulang, bukan
 * hanya angka akhirnya. `is_correct` nullable: soal yang belum dijawab berbeda
 * dari soal yang dijawab salah.
 */
#[Fillable(['order_index', 'question', 'options', 'correct_option', 'chosen_option', 'is_correct'])]
class SessionQuizItem extends Model
{
    protected function casts(): array
    {
        return [
            'options' => 'array',
            'is_correct' => 'boolean',
        ];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(ReadingSession::class, 'reading_session_id');
    }

    /** @return array<string, mixed> */
    public function toSummary(): array
    {
        return [
            'id' => $this->id,
            'order_index' => $this->order_index,
            'question' => $this->question,
            'options' => $this->options,
            'correct_option' => $this->correct_option,
            'chosen_option' => $this->chosen_option,
            'is_correct' => $this->is_correct,
        ];
    }
}
