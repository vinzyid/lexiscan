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
     * Penyedia LLM untuk AI Text Simplification dan AI Explain This.
     * Prompt dan cache dibagi bersama; hanya lapisan HTTP yang berbeda,
     * jadi 'provider' bisa ditukar tanpa mengubah endpoint apa pun.
     */
    'ai' => [
        'provider' => env('AI_PROVIDER', 'gemini'),
        // Free tier kedua penyedia dibatasi, jadi hasil identik di-cache.
        'cache_ttl' => (int) env('AI_CACHE_TTL', 86400),
        'timeout' => (int) env('AI_TIMEOUT', 60),
    ],

    /*
     * Model default sengaja Flash: itu yang tersedia di free tier Google AI
     * Studio (seri Pro sudah berbayar) dan cukup cepat untuk dipakai
     * interaktif di dalam aplikasi.
     */
    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'model' => env('GEMINI_MODEL', 'gemini-2.5-flash'),
    ],

    /*
     * xAI (Grok). API-nya OpenAI-compatible. Daftar model per akun berbeda —
     * cek milik sendiri dengan:
     *   curl https://api.x.ai/v1/models -H "Authorization: Bearer $XAI_API_KEY"
     */
    'grok' => [
        'key' => env('XAI_API_KEY'),
        'model' => env('XAI_MODEL', 'grok-4.5'),
    ],

    /*
     * OpenRouter — satu kunci untuk banyak model, OpenAI-compatible.
     * Model default harus yang mendukung structured outputs, kalau tidak
     * jaminan format paragraf hilang. Per Juli 2026 hanya 5 model gratis
     * yang mendukungnya; alternatif selain default di bawah:
     *   nvidia/nemotron-3-super-120b-a12b:free  (paling besar)
     *   openai/gpt-oss-20b:free
     *   nvidia/nemotron-nano-9b-v2:free         (paling ringan)
     * Daftar terkini: https://openrouter.ai/api/v1/models (publik, tanpa kunci).
     */
    'openrouter' => [
        'key' => env('OPENROUTER_API_KEY'),
        'model' => env('OPENROUTER_MODEL', 'google/gemma-4-26b-a4b-it:free'),
    ],

];
