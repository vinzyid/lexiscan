<?php

/*
|--------------------------------------------------------------------------
| Jejak Karbon Inferensi LLM
|--------------------------------------------------------------------------
|
| Konstanta untuk menaksir energi dan emisi satu permintaan AI. Semuanya bisa
| ditimpa lewat .env supaya bisa disesuaikan tanpa mengubah kode.
|
| RANTAI PERHITUNGANNYA:
|
|   energi_chip (Wh) = (token_masuk x wh_per_input_token)
|                    + (token_keluar x wh_per_output_token)
|   energi_total(Wh) = energi_chip x pue
|   emisi (gCO2e)    = energi_total (kWh) x grid_intensity
|
| KALIBRASI. Angka per-token di bawah bukan hasil pengukuran sendiri — tidak
| ada cara mengukur konsumsi listrik GPU orang lain dari sisi klien. Angka ini
| DITURUNKAN MUNDUR dari besaran yang dipublikasikan Google untuk Gemini,
| sehingga satu permintaan berukuran menengah (~500 token masuk, ~400 token
| keluar) mendarat di sekitar angka publikasi itu:
|
|   (500 x 0,00004 + 400 x 0,0005) x 1,09        = 0,240 Wh
|   0,240 Wh = 0,000240 kWh x 125 gCO2e/kWh      = 0,030 gCO2e
|
| PENTING SEBELUM DIPAKAI DI DOKUMEN RESMI: verifikasi sendiri angka rujukan
| Google yang terbaru dan cantumkan sitasinya. Taksiran seperti ini punya
| ketidakpastian besar — pembagian antara token masuk dan keluar, jenis
| akselerator, tingkat utilisasi, dan lokasi datacenter semuanya berpengaruh
| dan tidak satupun terlihat dari sisi klien. Sajikan sebagai TAKSIRAN dengan
| metodologi terbuka, bukan sebagai pengukuran.
|
*/

return [

    /*
     * Energi per token masuk (Wh). Jauh lebih kecil daripada token keluar:
     * seluruh prompt diproses sekaligus dalam satu tahap prefill yang sangat
     * paralel, sementara token keluar dibangkitkan satu per satu dan masing-
     * masing menuntut satu lintasan penuh melewati seluruh bobot model.
     */
    'wh_per_input_token' => (float) env('FOOTPRINT_WH_PER_INPUT_TOKEN', 0.00004),

    /* Energi per token keluar (Wh). Penyumbang utama, lihat alasan di atas. */
    'wh_per_output_token' => (float) env('FOOTPRINT_WH_PER_OUTPUT_TOKEN', 0.0005),

    /*
     * Power Usage Effectiveness: pengali untuk listrik yang dipakai gedung
     * datacenter di luar chip itu sendiri — pendinginan, distribusi daya,
     * penerangan. 1,0 berarti sempurna (mustahil); rata-rata industri sekitar
     * 1,5; Google melaporkan armadanya jauh lebih efisien dari itu.
     */
    'pue' => (float) env('FOOTPRINT_PUE', 1.09),

    /*
     * Intensitas karbon listrik yang dipakai datacenter, dalam gram CO2e per
     * kWh. Ini variabel yang paling berpengaruh sekaligus paling sering salah
     * dipakai orang.
     *
     * Nilai bawaan 125 mengikuti campuran listrik Google (mereka membeli
     * energi terbarukan dalam jumlah besar, jadi jauh di bawah rata-rata).
     *
     * Pembanding yang berguna untuk pembahasan:
     *   ~125  campuran Google (market-based)
     *   ~480  rata-rata dunia
     *   ~650  jaringan listrik Indonesia, yang masih didominasi batu bara
     *
     * Pakai angka wilayah tempat MODEL BERJALAN, bukan tempat penggunanya
     * berada. Inferensi Gemini tidak terjadi di Indonesia, jadi memakai 650
     * akan melebih-lebihkan emisi — kecuali Anda memang sengaja ingin
     * menunjukkan skenario "bagaimana jika model ini dilayani dari dalam
     * negeri", yang justru pembandingan menarik untuk dibahas.
     */
    'grid_intensity_g_per_kwh' => (float) env('FOOTPRINT_GRID_INTENSITY', 125.0),

    /*
     * Penanda versi metodologi, ikut dikirim di setiap respons. Kalau konstanta
     * di atas diubah, naikkan versinya supaya angka lama dan baru tidak
     * tercampur diam-diam saat dianalisis.
     */
    'method' => 'lexiscan-v1',

];
