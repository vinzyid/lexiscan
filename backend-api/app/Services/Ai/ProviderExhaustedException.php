<?php

namespace App\Services\Ai;

use RuntimeException;

/**
 * Penyedia menolak permintaan karena kehabisan jatah, bukan karena salah
 * konfigurasi: kuota harian habis, rate limit tercapai, saldo tidak cukup, atau
 * server hulunya sedang goyah.
 *
 * Dibedakan dari RuntimeException biasa supaya FallbackProvider tahu kapan
 * berpindah ke penyedia cadangan. Kunci yang salah atau model yang tidak ada
 * SENGAJA tidak masuk ke sini — kegagalan seperti itu akan tetap gagal berapa
 * kali pun dicoba, dan menutupinya dengan cadangan hanya membuat salah
 * konfigurasi menjadi tak terlihat sampai cadangannya ikut habis.
 */
class ProviderExhaustedException extends RuntimeException {}
