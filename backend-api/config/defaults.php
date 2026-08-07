<?php

/*
|--------------------------------------------------------------------------
| Bawaan Preferensi Pengguna Baru
|--------------------------------------------------------------------------
|
| Nilai awal yang dipakai aplikasi saat dijalankan pertama kali, sebelum
| pengguna sempat mengatur apa pun. Admin bisa menimpanya dari dashboard tanpa
| merilis ulang aplikasi; yang di sini hanya nilai jatuh-baliknya.
|
| Pilihannya harus sama persis dengan ThemeId dan TypeLevelId di aplikasi
| mobile (mobile-app/src/theme/palettes.ts). Nilai yang tidak dikenal akan
| diabaikan aplikasi dan diganti bawaan bawaannya sendiri, jadi salah ketik di
| sini tidak merusak apa pun — hanya tidak berpengaruh.
|
*/

return [

    'typography' => [
        /*
         * Krem: latar hangat berkontras rendah. Dipilih sebagai bawaan karena
         * putih terang memperparah keluhan silau dan "huruf berenang" yang
         * sering dilaporkan pembaca disleksia.
         */
        'theme' => 'krem',

        /*
         * Sedang: jarak huruf dan baris yang dilonggarkan, tanpa membuat teks
         * jadi terlalu renggang untuk dibaca mengalir.
         */
        'type_level' => 'sedang',
    ],

    /** Pilihan sah, dipakai memvalidasi suntingan admin di dashboard. */
    'options' => [
        'themes' => ['krem', 'kuning', 'biru', 'hijau', 'gelap'],
        'type_levels' => ['ringan', 'sedang', 'berat'],
    ],

];
