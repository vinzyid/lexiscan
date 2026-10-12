<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Soal kuis pemahaman yang benar-benar dinilai pada sebuah sesi.
 *
 * Disimpan terpisah dari `reading_sessions` karena satu sesi boleh punya 3-5
 * soal, dan yang perlu ditinjau ulang bukan hanya skornya tetapi soal mana yang
 * benar — termasuk pilihan yang dipilih pembaca. Tanpa baris per soal, skor
 * "3 dari 5" tidak bisa ditelusuri kembali ke pertanyaannya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_quiz_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reading_session_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('order_index');
            $table->text('question');
            $table->json('options');
            $table->unsignedInteger('correct_option');
            $table->unsignedInteger('chosen_option')->nullable();
            $table->boolean('is_correct')->nullable();
            $table->timestamps();

            $table->index(['reading_session_id', 'order_index']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_quiz_items');
    }
};
