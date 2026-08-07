<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\FeedbackController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Terbuka tanpa kunci: gunanya memang memeriksa kesehatan server dari luar
// setelah deploy. Isinya hanya status konfigurasi, tidak ada rahasia.
Route::get('/ai/health', [AiController::class, 'health']);

/*
 * 'api.key' menjaga kuota LLM dari pihak luar, 'throttle' menjaga pemakaian
 * berlebih oleh aplikasi yang sah. throttle ditaruh lebih dulu supaya percobaan
 * menebak kunci ikut terhitung dalam batas 20/menit.
 *
 * 'device' paling belakang: mengenali perangkat baru berarti menulis ke
 * database, dan itu tidak boleh terjadi untuk permintaan yang toh akan ditolak
 * karena kuncinya salah.
 */
Route::middleware(['throttle:20,1', 'api.key', 'device'])->group(function (): void {
    Route::post('/simplify-text', [AiController::class, 'simplify']);
    Route::post('/explain-word', [AiController::class, 'explain']);
    Route::post('/correct-typo', [AiController::class, 'correctTypo']);

    // Tidak memakai kuota LLM, tapi tetap dijaga: tanpa itu endpoint ini jadi
    // jalur termudah untuk membanjiri database dari luar.
    Route::post('/feedback', [FeedbackController::class, 'store']);
});
