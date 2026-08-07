<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Penjaga endpoint AI: header X-Api-Key harus cocok dengan AI_API_KEY server.
 *
 * Tujuannya menjaga kuota LLM, bukan privasi data. Tanpa ini siapa pun yang
 * tahu URL-nya bisa memakai backend kami sebagai relai LLM gratis; throttle
 * per-IP saja tidak cukup karena alamat IP mudah diganti.
 */
class RequireApiKey
{
    /** Header yang dikirim aplikasi mobile; lihat src/api/ai.ts. */
    public const HEADER = 'X-Api-Key';

    public function handle(Request $request, Closure $next): Response
    {
        if (! config('services.ai.require_api_key')) {
            return $next($request);
        }

        $expected = (string) config('services.ai.api_key');

        // Fail-closed: AI_API_KEY yang lupa diisi saat deploy harus menolak
        // permintaan, bukan membuka endpoint tanpa tanda apa pun.
        if ($expected === '') {
            return $this->deny(
                'Server belum dikonfigurasi: AI_API_KEY masih kosong. Hubungi pengelola aplikasi.',
                503,
            );
        }

        $given = (string) $request->header(self::HEADER, '');

        // hash_equals: waktu bandingnya tetap sama, jadi kunci tidak bisa
        // ditebak karakter per karakter lewat selisih waktu respons.
        if ($given === '' || ! hash_equals($expected, $given)) {
            return $this->deny(
                'Aplikasi ini tidak dikenali server. Pastikan memakai versi resmi LexiScan yang terbaru.',
                401,
            );
        }

        return $next($request);
    }

    /** Bentuknya sama dengan error API lain: satu field `message` siap tampil. */
    private function deny(string $message, int $status): JsonResponse
    {
        return response()->json(['message' => $message], $status);
    }
}
