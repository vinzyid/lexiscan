<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * Penyedia menjawab, tapi jawabannya tidak bisa dipakai — bukan JSON yang bisa
 * dibaca, atau kosong setelah dibersihkan.
 *
 * Dibedakan dari RuntimeException biasa supaya rantai penyedia tahu bahwa
 * mencoba penyedia berikutnya masuk akal: permintaannya sudah diterima dengan
 * baik, modelnya saja yang tidak menuruti format. Kunci yang salah atau model
 * yang tidak ada tetap RuntimeException biasa — mencobanya di penyedia lain
 * tidak akan menolong dan hanya menutupi salah konfigurasi.
 */
class ProviderResponseException extends RuntimeException {}
