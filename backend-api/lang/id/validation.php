<?php

/*
 * Pesan validasi bahasa Indonesia.
 *
 * Aplikasi mobile menampilkan field `message` dari respons 422 langsung ke
 * pengguna (lihat mobile-app/src/api/ai.ts). Karena penggunanya pembaca
 * disleksia berbahasa Indonesia, pesan bawaan Laravel yang berbahasa Inggris
 * tidak bisa dipakai apa adanya.
 *
 * Hanya aturan yang benar-benar dipakai endpoint LexiScan yang diterjemahkan;
 * sisanya jatuh ke APP_FALLBACK_LOCALE.
 */

return [
    'required' => 'Kolom :attribute wajib diisi.',
    'string' => 'Kolom :attribute harus berupa teks.',
    'in' => 'Pilihan :attribute tidak valid.',

    'min' => [
        'string' => 'Kolom :attribute minimal :min karakter.',
        'numeric' => 'Kolom :attribute minimal :min.',
        'array' => 'Kolom :attribute minimal berisi :min item.',
    ],

    'max' => [
        'string' => 'Kolom :attribute maksimal :max karakter.',
        'numeric' => 'Kolom :attribute maksimal :max.',
        'array' => 'Kolom :attribute maksimal berisi :max item.',
    ],

    /*
     * Nama kolom teknis diganti istilah yang berarti bagi pengguna, supaya
     * pesannya terbaca "Kolom teks wajib diisi", bukan "Kolom text wajib diisi".
     */
    'attributes' => [
        'text' => 'teks',
        'level' => 'level penyederhanaan',
        'term' => 'kata yang dijelaskan',
        'style' => 'gaya penjelasan',
        'context' => 'konteks kalimat',
    ],
];
