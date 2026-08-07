<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Perangkat yang memakai LexiScan.
 *
 * Bukan akun. LexiScan sengaja tidak mewajibkan pendaftaran — formulir masuk
 * menuntut ketepatan mengeja dan mengingat sandi, dua hal yang justru menjadi
 * hambatan bagi penyandang disleksia. Yang disimpan hanya UUID acak yang
 * dibangkitkan aplikasi saat pertama dijalankan, tanpa nama, email, maupun
 * apa pun yang menunjuk ke orangnya.
 *
 * Gunanya satu: menjaga keberlanjutan kuota LLM. Tanpa penanda ini, satu
 * penyalahguna hanya bisa ditindak dengan memblokir alamat IP-nya, yang mudah
 * diganti dan ikut menjatuhkan pengguna lain di jaringan yang sama.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table) {
            // UUID-nya dibangkitkan aplikasi, jadi dia langsung jadi kunci
            // primer: tidak ada id auto-increment yang perlu dipetakan.
            $table->uuid('id')->primary();

            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at')->index();

            // Null berarti aktif. Diisi saat admin memblokir dari dashboard.
            $table->timestamp('blocked_at')->nullable()->index();
            $table->string('blocked_reason')->nullable();

            // Catatan bebas untuk admin, misalnya asal laporan penyalahgunaan.
            $table->text('note')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
