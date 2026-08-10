<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FeedbackController;
use Illuminate\Support\Facades\Route;

// Terbuka tanpa kunci: gunanya memang memeriksa kesehatan server dari luar
// setelah deploy. Isinya hanya status konfigurasi, tidak ada rahasia.
Route::get('/ai/health', [AiController::class, 'health']);

/*
 * Pendaftaran dan masuk.
 *
 * throttle-nya lebih ketat dari endpoint AI (10/menit, bukan 20) karena inilah
 * satu-satunya jalur di API ini yang bisa ditebak berulang-ulang: menebak kata
 * sandi hanya menarik kalau percobaannya boleh banyak.
 *
 * 'device' tidak ikut: mendaftar belum tentu memakai kuota LLM, dan penanda
 * perangkat gunanya memang mengaitkan pemakaian AI ke perangkatnya.
 */
Route::middleware(['throttle:10,1', 'api.key'])->group(function (): void {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

/*
 * Yang menuntut token Sanctum. Tidak perlu 'api.key' lagi — token pribadi
 * penggunanya sudah jauh lebih kuat daripada kunci bersama yang ditanam di APK.
 */
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::patch('/auth/preferences', [AuthController::class, 'preferences']);
});

/*
 * 'api.key' menjaga kuota LLM dari pihak luar, 'throttle' menjaga pemakaian
 * berlebih oleh aplikasi yang sah. throttle ditaruh lebih dulu supaya percobaan
 * menebak kunci ikut terhitung dalam batas 20/menit.
 *
 * 'device' paling belakang: mengenali perangkat baru berarti menulis ke
 * database, dan itu tidak boleh terjadi untuk permintaan yang toh akan ditolak
 * karena kuncinya salah.
 *
 * Sengaja TIDAK menuntut token: fitur AI harus tetap bisa dicoba sebelum
 * mendaftar, dan pembatas pemakaiannya sudah ada di lapisan perangkat.
 */
Route::middleware(['throttle:20,1', 'api.key', 'device'])->group(function (): void {
    Route::post('/simplify-text', [AiController::class, 'simplify']);
    Route::post('/explain-word', [AiController::class, 'explain']);
    Route::post('/correct-typo', [AiController::class, 'correctTypo']);

    // Tidak memakai kuota LLM, tapi tetap dijaga: tanpa itu endpoint ini jadi
    // jalur termudah untuk membanjiri database dari luar.
    Route::post('/feedback', [FeedbackController::class, 'store']);
});
