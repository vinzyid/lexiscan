<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Penyedia LLM untuk fitur AI. Prompt dan cache dibagi bersama; hanya
     * lapisan HTTP yang berbeda, jadi 'provider' bisa ditukar kapan saja.
     */
    'ai' => [
        'provider' => env('AI_PROVIDER', 'gemini'),

        /*
         * Penyedia cadangan yang mengambil alih begitu yang utama kehabisan
         * jatah — kuota harian habis, rate limit, saldo kurang, atau server
         * hulunya sedang goyah. Kosongkan untuk mematikannya.
         *
         * Bukan pengganti pemilihan penyedia: kunci yang salah atau model yang
         * tidak ada tetap gagal tanpa berpindah, supaya salah konfigurasi
         * ketahuan alih-alih tertutupi. Lihat FallbackProvider.
         */
        'fallback' => env('AI_FALLBACK_PROVIDER'),

        /*
         * Umur simpanan hasil AI, dalam detik. Kosong atau 0 berarti selamanya,
         * dan itulah bawaannya.
         *
         * Kunci cache memuat md5 teks masukannya, jadi satu entri hanya pernah
         * dipakai ulang oleh permintaan yang benar-benar identik — dan jawaban
         * atas teks yang sama tidak punya alasan untuk basi. Membiarkannya
         * kedaluwarsa berarti menyalakan model lagi untuk pertanyaan yang sudah
         * pernah dijawab: kuota gratis terbuang, dan emisinya keluar dua kali
         * untuk hasil yang sama.
         *
         * Diisi hanya kalau simpanannya memang perlu dibatasi, misalnya saat
         * store-nya dipakai bersama layanan lain dan ukurannya harus dijaga.
         */
        'cache_ttl' => max(0, (int) env('AI_CACHE_TTL', 0)) ?: null,
        'timeout' => (int) env('AI_TIMEOUT', 60),

        /*
         * Kunci bersama backend <-> aplikasi mobile, bukan autentikasi per
         * pengguna. Nilainya ditanam ke APK saat build sehingga bisa diekstrak
         * dari APK — penghalang pemakaian kuota, bukan jaminan keamanan.
         */
        'api_key' => env('AI_API_KEY'),

        // Wajib di mana pun kecuali mesin pengembang dan test. Lihat RequireApiKey.
        'require_api_key' => (bool) env(
            'AI_REQUIRE_API_KEY',
            ! in_array(env('APP_ENV', 'production'), ['local', 'testing'], true),
        ),
    ],

    /*
     * Default-nya Flash: seri itu yang tersedia di free tier Google AI Studio
     * dan cukup cepat untuk dipakai interaktif. Jangan turunkan ke
     * gemini-2.5-flash — sudah ditutup untuk pengguna baru dan membalas 404.
     */
    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-3.6-flash'),
    ],

    /*
     * Daftar model berbeda per akun; cek milik sendiri dengan:
     *   curl https://api.x.ai/v1/models -H "Authorization: Bearer $XAI_API_KEY"
     */
    'grok' => [
        'key' => env('XAI_API_KEY'),
        'model' => env('XAI_MODEL', 'grok-4.5'),
    ],

    /*
     * Daftar model berbeda per akun; cek milik sendiri dengan:
     *   curl https://api.mistral.ai/v1/models -H "Authorization: Bearer $MISTRAL_API_KEY"
     */
    'mistral' => [
        'key' => env('MISTRAL_API_KEY'),
        'model' => env('MISTRAL_MODEL', 'mistral-small-latest'),
    ],

    /*
     * Model harus mendukung structured outputs, kalau tidak jaminan format
     * paragraf hilang. Alternatif gratis: nvidia/nemotron-3-super-120b-a12b:free,
     * openai/gpt-oss-20b:free, nvidia/nemotron-nano-9b-v2:free.
     * Daftar terkini: https://openrouter.ai/api/v1/models
     */
    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),
        'model' => env('OPENROUTER_MODEL', 'x-ai/grok-2-1212'),
    ],

];
