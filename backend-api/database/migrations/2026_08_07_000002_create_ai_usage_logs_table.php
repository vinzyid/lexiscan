<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Satu baris per permintaan AI yang dilayani.
 *
 * Inilah sumber data untuk pemantauan konsumsi dan kuota LLM di dashboard
 * admin. Angka jejak karbon ikut disimpan — bukan dihitung ulang saat
 * ditampilkan — supaya laporan lama tidak berubah diam-diam ketika konstanta
 * di config/footprint.php dikalibrasi ulang.
 *
 * Isinya sengaja tidak memuat teks yang dibaca pengguna: yang dicatat hanya
 * besaran yang dibutuhkan untuk mengoperasikan layanan.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_usage_logs', function (Blueprint $table) {
            $table->id();

            /*
             * Boleh kosong: permintaan dari aplikasi versi lama yang belum
             * mengirim penanda perangkat tetap dicatat, karena kuotanya tetap
             * terpakai. Perangkat yang dihapus admin menyisakan lognya —
             * angka konsumsi historis tidak boleh ikut lenyap.
             */
            $table->foreignUuid('device_id')->nullable()->index()
                ->constrained('devices')->nullOnDelete();

            // simplify | explain | correct_typo
            $table->string('feature', 20)->index();
            // Level L2..L5 untuk simplify, gaya untuk explain, kosong untuk sisanya.
            $table->string('variant', 20)->nullable();
            $table->string('language', 5);

            $table->string('provider', 20)->index();
            $table->string('model');

            // Pembeda terpenting bagi admin: permintaan yang dilayani simpanan
            // tidak memakai kuota maupun energi sama sekali.
            $table->boolean('cached')->index();

            $table->unsignedInteger('input_tokens')->default(0);
            $table->unsignedInteger('output_tokens')->default(0);

            /*
             * Desimal, bukan float: nilainya kecil (satu permintaan sekitar
             * 0,03 gCO2e) dan akan sering dijumlahkan. Galat pembulatan float
             * yang menumpuk di SUM() akan terlihat sebagai selisih nyata di
             * laporan bulanan.
             */
            $table->decimal('energy_wh', 12, 6)->default(0);
            $table->decimal('co2e_g', 12, 6)->default(0);
            $table->decimal('avoided_energy_wh', 12, 6)->default(0);
            $table->decimal('avoided_co2e_g', 12, 6)->default(0);

            // Latensi yang dirasakan pengguna, untuk memantau kesehatan penyedia.
            $table->unsignedInteger('duration_ms')->nullable();

            // Append-only, jadi tidak ada updated_at. Diindeks karena hampir
            // semua panel dashboard menyaring berdasarkan rentang waktu.
            $table->timestamp('created_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usage_logs');
    }
};
