<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Jenjang sekolah penggunanya — ditanyakan di langkah 2 pendaftaran.
 *
 * KENAPA TERPISAH DARI `reading_level`, PADAHAL SAMA-SAMA SOAL KEMAMPUAN.
 * Keduanya menjawab pertanyaan yang berbeda dan sering tidak sejalan: anak
 * kelas 5 yang masih mengeja bukan hal aneh, dan justru dialah yang paling
 * dituju aplikasi ini. `reading_level` menentukan penyesuaian tampilan;
 * `school_level` hanya menerangkan konteks umurnya, mis. untuk memilih
 * perbendaharaan kata saat menyederhanakan teks.
 *
 * Nullable, dan akan tetap begitu. Seluruh akun yang mendaftar sebelum kolom
 * ini ada tidak punya jawabannya, dan tidak ada gunanya menebak — kolom kosong
 * jujur lebih berguna daripada 'umum' yang dikarang.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('readers', function (Blueprint $table) {
            $table->string('school_level')->nullable()->after('reading_level');
        });
    }

    public function down(): void
    {
        Schema::table('readers', function (Blueprint $table) {
            $table->dropColumn('school_level');
        });
    }
};
