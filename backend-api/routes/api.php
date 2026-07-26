<?php

use App\Http\Controllers\AiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

/*
 * Endpoint AI masih terbuka karena MVP dijalankan lokal untuk demo.
 * Sebelum dipublikasikan, bungkus dengan middleware 'auth:sanctum' — kalau
 * tidak, kuota Gemini gratis bisa dihabiskan siapa saja.
 */
Route::get('/ai/health', [AiController::class, 'health']);
Route::post('/simplify-text', [AiController::class, 'simplify'])->middleware('throttle:20,1');
Route::post('/explain-word', [AiController::class, 'explain'])->middleware('throttle:20,1');
