<?php

namespace App\Http\Middleware;

use App\Models\Device;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Mengenali perangkat pengirim lewat header X-Device-Id, lalu menolak yang
 * sudah diblokir admin.
 *
 * Penandanya UUID acak yang dibangkitkan aplikasi saat pertama dijalankan —
 * bukan akun, dan tidak menunjuk ke siapa pun. LexiScan sengaja tidak
 * mewajibkan pendaftaran; alasannya ada di migrasi create_devices_table.
 *
 * SEJAUH MANA INI MENJAGA. Sama seperti RequireApiKey: penghalang pemakaian
 * berlebih, bukan jaminan keamanan. Penanda yang hilang tidak membatalkan
 * permintaan, karena aplikasi versi lama belum mengirimnya dan mewajibkannya
 * pun tidak menutup celah — siapa pun yang sengaja menyalahgunakan cukup
 * membangkitkan UUID baru. Yang benar-benar dijaga di sini adalah pemakaian
 * wajar: satu perangkat yang kebablasan bisa dihentikan tanpa ikut menjatuhkan
 * pengguna lain yang kebetulan satu alamat IP.
 */
class IdentifyDevice
{
    /** Header yang dikirim aplikasi mobile; lihat src/api/ai.ts. */
    public const HEADER = 'X-Device-Id';

    /** Kunci atribut request tempat perangkat disimpan untuk lapisan berikutnya. */
    public const ATTRIBUTE = 'device';

    public function handle(Request $request, Closure $next): Response
    {
        $id = $this->readId($request);

        if ($id === null) {
            return $next($request);
        }

        /*
         * Database yang sedang tidak terjangkau tidak boleh ikut mematikan
         * fitur AI — pencatatan pemakaian adalah kebutuhan operasional, bukan
         * syarat melayani pengguna. Perlakuannya sama dengan cache di
         * AiTextService: gagal dicatat, permintaan tetap jalan.
         */
        try {
            $device = $this->touch($id);
        } catch (Throwable) {
            return $next($request);
        }

        if ($device->isBlocked()) {
            return response()->json([
                'message' => 'Perangkat ini dihentikan sementara karena pemakaian yang tidak wajar. Hubungi pengelola aplikasi.',
            ], 403);
        }

        $request->attributes->set(self::ATTRIBUTE, $device);

        return $next($request);
    }

    /** UUID yang tidak berbentuk sah diperlakukan sebagai tidak ada sama sekali. */
    private function readId(Request $request): ?string
    {
        $id = trim((string) $request->header(self::HEADER, ''));

        return Str::isUuid($id) ? strtolower($id) : null;
    }

    /** Catat perangkat baru, atau perbarui jejak terakhir yang sudah dikenal. */
    private function touch(string $id): Device
    {
        $now = Carbon::now();

        $device = Device::find($id);

        if ($device === null) {
            return Device::create([
                'id' => $id,
                'first_seen_at' => $now,
                'last_seen_at' => $now,
            ]);
        }

        /*
         * Ditulis lewat query, bukan save(), supaya tidak menimpa perubahan
         * yang baru saja dibuat admin — memblokir perangkat dan permintaan
         * dari perangkat itu bisa terjadi pada detik yang sama.
         */
        Device::whereKey($id)->update(['last_seen_at' => $now]);

        return $device;
    }
}
