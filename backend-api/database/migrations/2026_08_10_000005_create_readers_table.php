<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Akun pengguna aplikasi LexiScan.
 *
 * KENAPA SEKARANG ADA, PADAHAL DULU SENGAJA TIDAK. Versi sebelumnya menolak
 * pendaftaran dengan alasan yang masih benar: mengeja nama pengguna dan
 * mengingat kata sandi memang menghambat penyandang disleksia (lihat
 * create_devices_table). Yang berubah adalah timbangannya. Tanpa akun,
 * aplikasi tidak punya tempat menyimpan KEMAMPUAN MEMBACA penggunanya,
 * sehingga tipografi, pemenggalan suku kata, dan suara tidak bisa menyesuaikan
 * diri — dan penyesuaian itulah inti masukan dari dosen PLB.
 *
 * Hambatannya ditekan di dua tempat, bukan dihilangkan: pendaftaran dirancang
 * untuk dilakukan bersama guru atau orang tua, dan seluruh form di aplikasi
 * bisa dibacakan serta menampilkan kata sandi apa adanya.
 *
 * TABELNYA SENDIRI, TERPISAH DARI `users`. `App\Models\User::canAccessPanel()`
 * mengembalikan true untuk setiap barisnya, karena seluruh isi tabel itu memang
 * administrator. Menaruh pengguna aplikasi di sana berarti setiap orang yang
 * mendaftar langsung bisa membuka /admin.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('readers', function (Blueprint $table) {
            $table->id();

            $table->string('name');

            /*
             * Nama pengguna, bukan email: anak yang belum lancar membaca tidak
             * punya email sendiri, dan alamat email jauh lebih panjang untuk
             * diketik ulang. Disimpan huruf kecil semua supaya "Rafi" dan
             * "rafi" tidak menjadi dua akun berbeda.
             */
            $table->string('username')->unique();
            $table->string('password');

            /*
             * Sumber semua penyesuaian tampilan. Nilainya sengaja deskriptif
             * ('belum'/'mengeja'/'lancar') dan bukan 'tinggi'/'sedang'/'rendah'
             * seperti klasifikasi kelompok asesmen — di kode, "tinggi" tidak
             * pernah jelas merujuk kemampuan yang tinggi atau kesulitan yang
             * tinggi. Pemetaannya:
             *
             *   belum   = kesulitan membaca TINGGI
             *   mengeja = kesulitan membaca SEDANG
             *   lancar  = kesulitan membaca RENDAH
             */
            $table->string('reading_level')->default('mengeja')->index();

            /*
             * Preferensi tampilan & suara.
             *
             * Nullable, dan itu bermakna: null berarti pengguna belum pernah
             * menyimpang dari preset level membacanya, sehingga preset masih
             * boleh menimpanya saat levelnya berubah. Begitu diisi, ia menjadi
             * pilihan sadar pengguna dan tidak boleh ditimpa lagi — aturan yang
             * sama dengan `preferencesTouched` di aplikasi.
             */
            $table->string('language')->default('id');
            $table->string('theme')->nullable();
            $table->string('type_level')->nullable();
            $table->boolean('tts_enabled')->nullable();
            $table->boolean('tts_auto_play')->nullable();
            $table->boolean('syllable_spacing')->nullable();
            $table->boolean('bicolor_words')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readers');
    }
};
