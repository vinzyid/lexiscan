<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Umpan balik pengguna dan laporan kegagalan OCR.
 *
 * OCR berjalan sepenuhnya di perangkat, jadi kegagalannya tidak pernah
 * menyentuh server dengan sendirinya — satu-satunya cara tim tahu adalah kalau
 * penggunanya melaporkan. Karena itu laporannya dikirim atas persetujuan
 * pengguna, dan potongan teks yang menyertainya bersifat opsional.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table) {
            $table->id();

            // Anonim, sama seperti di tabel pemakaian: cukup untuk melihat
            // apakah beberapa laporan datang dari perangkat yang sama.
            $table->foreignUuid('device_id')->nullable()->index()
                ->constrained('devices')->nullOnDelete();

            // feedback | ocr_failure
            $table->string('type', 20)->index();

            $table->text('message');

            /*
             * Potongan teks hasil OCR yang gagal, kalau pengguna setuju
             * mengirimkannya. Boleh kosong — laporan tanpa contoh tetap
             * berguna untuk melihat pola, dan memaksakannya berarti memaksa
             * pengguna membagikan isi bacaannya.
             */
            $table->text('sample')->nullable();

            // Versi aplikasi dan platform: kegagalan OCR sering khas perangkat.
            $table->string('app_version', 20)->nullable();
            $table->string('platform', 20)->nullable();

            // Diisi admin saat laporannya sudah ditindaklanjuti.
            $table->timestamp('handled_at')->nullable()->index();
            $table->text('handled_note')->nullable();

            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
