<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Parameter sistem yang bisa diubah admin tanpa merilis ulang aplikasi.
 *
 * Nilai bawaan setiap parameter tetap tertulis di kode — tabel ini hanya berisi
 * yang SUDAH DIUBAH. Konsekuensinya penting: layanan tetap jalan dengan benar
 * saat tabelnya kosong, saat databasenya tidak terjangkau, atau saat parameter
 * baru ditambahkan di kode tapi belum pernah disunting siapa pun.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            // Kuncinya nama parameter, jadi satu parameter mustahil punya dua baris.
            $table->string('key')->primary();

            // JSON supaya satu baris bisa memuat struktur bersarang seperti
            // seluruh aturan penyederhanaan per bahasa dan per level.
            $table->json('value');

            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
