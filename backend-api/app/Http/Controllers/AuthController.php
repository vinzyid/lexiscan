<?php

namespace App\Http\Controllers;

use App\Models\Reader;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\TransientToken;

/**
 * Pendaftaran dan masuk untuk pengguna aplikasi (App\Models\Reader).
 *
 * Yang membedakannya dari controller autentikasi biasa adalah siapa yang
 * mengisinya. Formulir ini dirancang untuk diisi anak bersama guru atau orang
 * tuanya, dan satu-satunya alasan akun ini ada adalah menyimpan `reading_level`
 * — dari situlah tipografi, pemenggalan suku kata, dan suara di aplikasi
 * menyesuaikan diri.
 */
class AuthController extends Controller
{
    /** Nama token Sanctum; muncul di tabel personal_access_tokens. */
    private const TOKEN_NAME = 'lexiscan-mobile';

    /** POST /api/auth/register */
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:60'],

            /*
             * alpha_dash, bukan email. Penggunanya belum tentu punya email, dan
             * alamat email jauh lebih panjang untuk diketik ulang setiap masuk.
             */
            'username' => ['required', 'string', 'min:3', 'max:30', 'alpha_dash'],

            /*
             * Enam karakter, bukan delapan seperti bawaan Laravel. Setiap
             * karakter tambahan adalah satu peluang salah eja bagi pengguna
             * yang justru kesulitan mengeja, dan akun ini tidak menyimpan apa
             * pun yang bernilai bagi penyerang — isinya preferensi tampilan.
             */
            'password' => ['required', 'string', 'min:6', 'max:72'],

            'reading_level' => ['required', Rule::in(Reader::readingLevels())],

            /*
             * Boleh kosong, tidak seperti reading_level. Jenjang sekolah tidak
             * mengubah apa pun di tampilan — ia hanya konteks umur — jadi
             * menahan pendaftaran gara-gara pertanyaan ini tidak sepadan.
             */
            'school_level' => ['nullable', Rule::in(Reader::schoolLevels())],

            'language' => ['nullable', Rule::in(['id', 'en'])],
        ]);

        $username = $this->normalizeUsername($data['username']);

        /*
         * Diperiksa terpisah, bukan lewat rule `unique`, karena yang harus unik
         * adalah bentuk yang sudah dinormalkan. Rule `unique` akan membandingkan
         * "Rafi" apa adanya dan meloloskannya meski "rafi" sudah ada.
         */
        if (Reader::where('username', $username)->exists()) {
            throw ValidationException::withMessages([
                'username' => 'Nama pengguna ini sudah dipakai. Coba tambahkan angka di belakangnya.',
            ]);
        }

        $reader = Reader::create([
            'name' => trim($data['name']),
            'username' => $username,
            'password' => $data['password'],
            'reading_level' => $data['reading_level'],
            'school_level' => $data['school_level'] ?? null,
            'language' => $data['language'] ?? 'id',
        ]);

        return $this->authenticated($reader, 201);
    }

    /** POST /api/auth/login */
    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'max:72'],
        ]);

        $reader = Reader::where('username', $this->normalizeUsername($data['username']))->first();

        /*
         * Hash::check tetap dijalankan lewat cabang yang sama supaya waktu
         * jawabannya tidak membocorkan apakah nama penggunanya ada. Pesannya
         * pun satu untuk kedua sebab.
         */
        if ($reader === null || ! Hash::check($data['password'], $reader->password)) {
            return response()->json([
                'message' => 'Nama pengguna atau kata sandi belum cocok. Coba periksa lagi ya.',
            ], 401);
        }

        return $this->authenticated($reader);
    }

    /** POST /api/auth/logout — hanya token yang sedang dipakai yang dicabut. */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()?->currentAccessToken();

        // Bisa null kalau autentikasinya lewat session, bukan token. Tidak
        // terjadi di aplikasi mobile, tapi juga bukan alasan untuk 500.
        if ($token !== null && ! $token instanceof TransientToken) {
            $token->delete();
        }

        return response()->json(['message' => 'Kamu sudah keluar.']);
    }

    /** GET /api/auth/me */
    public function me(Request $request): JsonResponse
    {
        return response()->json(['reader' => $request->user()->toProfile()]);
    }

    /**
     * PATCH /api/auth/preferences
     *
     * Supaya penyesuaian ikut pindah kalau penggunanya berganti HP. Semua
     * kolomnya boleh null, dan null di sini berarti "kembalikan ke preset level
     * membaca" — bukan "kosongkan".
     */
    public function preferences(Request $request): JsonResponse
    {
        $data = $request->validate([
            // Aturannya sama persis dengan saat mendaftar, dan `nullable`
            // sengaja TIDAK ikut: nama boleh diganti, tidak boleh dikosongkan.
            'name' => ['sometimes', 'string', 'min:2', 'max:60'],

            'reading_level' => ['sometimes', Rule::in(Reader::readingLevels())],
            'school_level' => ['sometimes', 'nullable', Rule::in(Reader::schoolLevels())],
            'language' => ['sometimes', 'nullable', Rule::in(['id', 'en'])],
            'theme' => ['sometimes', 'nullable', 'string', 'max:20'],
            'type_level' => ['sometimes', 'nullable', 'string', 'max:20'],
            'tts_enabled' => ['sometimes', 'nullable', 'boolean'],
            'tts_auto_play' => ['sometimes', 'nullable', 'boolean'],
            'syllable_spacing' => ['sometimes', 'nullable', 'boolean'],
            'bicolor_words' => ['sometimes', 'nullable', 'boolean'],
        ]);

        $reader = $request->user();

        /*
         * `theme` dan `type_level` tidak divalidasi terhadap daftar id yang
         * dikenal, hanya panjangnya. Alasannya sama dengan yang dipakai
         * applyServerDefaults di aplikasi: id yang tidak dikenal cukup
         * diabaikan sisi penerima, dan aplikasi versi baru boleh mengirim tema
         * yang belum ada waktu backend ini dirilis.
         *
         * forceFill, dan itu aman justru KARENA baris di atasnya: yang sampai
         * ke sini sudah disaring dua kali — lolos validasi, lalu disaring lagi
         * terhadap daftar putih preferenceKeys() yang tidak memuat `username`
         * maupun `password`. Memakai fill() biasa malah membuat endpoint ini
         * diam-diam tidak menyimpan apa pun, sebab atribut #[Fillable] pada
         * model sengaja hanya memuat kolom pendaftaran.
         */
        $reader->forceFill(array_intersect_key($data, array_flip(Reader::preferenceKeys())));
        $reader->save();

        return response()->json(['reader' => $reader->toProfile()]);
    }

    /** Satu-satunya tempat token dibuat, supaya bentuk responsnya seragam. */
    private function authenticated(Reader $reader, int $status = 200): JsonResponse
    {
        return response()->json([
            'token' => $reader->createToken(self::TOKEN_NAME)->plainTextToken,
            'reader' => $reader->toProfile(),
        ], $status);
    }

    /**
     * Huruf kecil semua, spasi dibuang.
     *
     * Tanpa ini "Rafi" dan "rafi" menjadi dua akun berbeda — jebakan yang
     * paling sering menimpa justru pengguna yang kesulitan mengeja, karena
     * papan ketik ponsel otomatis mengapitalkan huruf pertama.
     */
    private function normalizeUsername(string $username): string
    {
        return Str::lower(trim($username));
    }
}
