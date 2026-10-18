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
| Rujukan: Elsworth dkk. (2025), "Measuring the environmental impact of
| delivering AI at Google Scale", arXiv:2508.15734 (0,24 Wh dan 0,03 gCO2e per
| prompt median). Token keluar dibuat lebih mahal daripada token masuk
| mengikuti Wilkins dkk. (2024), HotCarbon '24, arXiv:2407.04014. Taksiran seperti ini punya
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
     * Nilai bawaan 125 diturunkan dari angka median prompt Gemini milik
     * Elsworth dkk. (2025, arXiv:2508.15734): 0,03 gCO2e / 0,24 Wh. Itu angka
     * menyeluruh versi Google, yaitu listrik market-based 94 gCO2e/kWh
     * ditambah Scope 1 dan 3, bukan intensitas jaringan listrik biasa.
     *
     * Pembanding yang berguna untuk pembahasan:
     *   ~125  Google menyeluruh (market-based + Scope 1 dan 3)
     *   ~345  Google berbasis lokasi (makalah yang sama)
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
