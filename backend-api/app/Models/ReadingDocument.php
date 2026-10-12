<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Teks yang dibaca, disimpan sebagai snapshot.
 *
 * Snapshot-nya utuh, bukan referensi ke hasil pindai yang bisa berubah: yang
 * dibandingkan LexiProgress harus bisa diverifikasi ulang, dan teks yang
 * berganti di belakang membuat angka lama kehilangan maknanya. `content_hash`
 * membedakan versi teks; kalau judulnya sama tapi hash-nya beda, itu dua versi.
 */
#[Fillable(['title', 'source_type', 'text_snapshot'])]
class ReadingDocument extends Model
{
    public const SOURCE_SCAN = 'scan';

    public const SOURCE_TEXT = 'text';

    public const SOURCE_SAMPLE = 'sample';

    protected static function booted(): void
    {
        static::saving(function (ReadingDocument $document): void {
            $document->content_hash = hash('sha256', $document->text_snapshot);
        });
    }

    /** @return array<string, string> */
    protected function casts(): array
    {
        return ['content_hash' => 'string'];
    }

    /** @return BelongsTo<Reader, $this> */
    public function reader(): BelongsTo
    {
        return $this->belongsTo(Reader::class);
    }

    /** @return HasMany<ReadingSession, $this> */
    public function sessions(): HasMany
    {
        return $this->hasMany(ReadingSession::class);
    }

    /** @return array<string, mixed> */
    public function toSummary(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'source_type' => $this->source_type,
            'content_hash' => $this->content_hash,
            'word_count' => ReadingSession::countWords($this->text_snapshot),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
