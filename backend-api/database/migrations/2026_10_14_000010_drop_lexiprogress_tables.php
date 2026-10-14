<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Menghapus seluruh tabel LexiProgress.
 *
 * Aplikasi ini alat deteksi dini risiko disleksia, bukan media pembelajaran.
 * Sesi baca terukur, goal belajar, dan kuis pemahaman yang dulu di sini
 * mengarahkan penggunanya ke pola latihan berkelanjutan — jadi semuanya
 * ditinggalkan.
 *
 * Urutan drop mengikuti ketergantungan foreign key: tabel anak lebih dulu,
 * baru induknya. `session_quiz_items` dan `session_features` menggantung pada
 * `reading_sessions`, dan `reading_sessions` menggantung pada
 * `reading_documents`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('session_quiz_items');
        Schema::dropIfExists('session_features');
        Schema::dropIfExists('reading_sessions');
        Schema::dropIfExists('reading_goals');
        Schema::dropIfExists('reading_documents');
    }

    public function down(): void
    {
        // Tidak ada jalan kembali: datanya sengaja dihapus, bukan dipindahkan.
    }
};
