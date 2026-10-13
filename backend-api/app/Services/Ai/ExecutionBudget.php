<?php

namespace App\Services\Ai;

/**
 * Anggaran waktu efektif untuk satu permintaan AI.
 *
 * KENAPA BUKAN SEKADAR AI_TOTAL_TIMEOUT. Kami pernah melihat "kebanyakan server
 * error" pada fitur penyederhanaan, dan sebabnya bukan penyedia AI melainkan
 * PHP: `max_execution_time` di server 30 detik, sementara kode mengizinkan
 * rantai penyedia berjalan 60 detik. PHP membunuh prosesnya di detik ke-30 —
 * hasilnya 500 — tepat saat server sebenarnya masih bekerja.
 *
 * Karena batas PHP berbeda di tiap mesin (lokal 0 = tanpa batas, server produksi
 * sering 30), angka mati tidak bisa dipakai. Kelas ini membaca batas yang BENAR-
 * BENAR berlaku lalu menyisakan jeda keamanan, sehingga rantai penyedia selalu
 * selesai (dan menjawab dengan galat yang rapi) sebelum PHP mematikannya paksa.
 */
final class ExecutionBudget
{
    /**
     * Jeda keamanan dari batas PHP, dalam detik.
     *
     * Rantai penyedia harus selesai SEBELUM batasnya, bukan tepat di batasnya:
     * masih ada pekerjaan setelah panggilan HTTP terakhir — menulis cache,
     * mencatat pemakaian, menyusun respons JSON. Tiga detik cukup untuk itu di
     * server yang wajar; terlalu besar justru memangkas waktu yang dibutuhkan
     * penyedia AI untuk menjawab halaman penuh.
     */
    private const PHP_SAFETY_MARGIN_SECONDS = 3.0;

    /**
     * Batas bawah anggaran. Kalau batas PHP begitu ketat sampai di bawah ini,
     * memperkecilnya lagi tidak menolong — lebih baik mencoba dan gagal cepat
     * daripada menolak setiap permintaan tanpa alasan yang jelas.
     */
    private const MIN_SECONDS = 5.0;

    /**
     * Anggaran untuk seluruh rantai penyedia, dalam detik.
     *
     * Diambil dari AI_TOTAL_TIMEOUT, lalu diperkecil bila batas eksekusi PHP
     * lebih ketat. `max_execution_time` bernilai 0 berarti tanpa batas, dan itu
     * memang terjadi di mesin pengembang — bukan berarti anggarannya nol.
     */
    public static function seconds(): float
    {
        return self::secondsFor(self::phpExecutionLimit());
    }

    /**
     * Anggaran dari batas PHP yang diberikan, tanpa membaca lingkungan.
     *
     * Dipisah supaya logikanya bisa diuji: `ini_get('max_execution_time')` tidak
     * bisa diubah saat test berjalan, dan justru kombinasi batas-PHP versus
     * AI_TOTAL_TIMEOUT inilah yang dulu salah dan menyebabkan 500.
     *
     * @param  float  $phpLimit  Batas `max_execution_time` dalam detik; 0 atau kurang berarti tanpa batas.
     */
    public static function secondsFor(float $phpLimit): float
    {
        $configured = (float) config('services.ai.total_timeout');

        if ($phpLimit <= 0.0) {
            return max(self::MIN_SECONDS, $configured);
        }

        $available = $phpLimit - self::PHP_SAFETY_MARGIN_SECONDS;

        return max(self::MIN_SECONDS, min($configured, $available));
    }

    /**
     * Batas `max_execution_time` PHP dalam detik; 0 atau kurang berarti tanpa
     * batas. Dibaca langsung dari `ini_get` supaya mengikuti mesin yang
     * benar-benar menjalankannya, bukan tebakan dari konfigurasi.
     */
    private static function phpExecutionLimit(): float
    {
        $raw = ini_get('max_execution_time');

        if ($raw === false || $raw === '') {
            return 0.0;
        }

        return (float) $raw;
    }
}
