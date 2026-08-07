<?php

use App\Http\Middleware\IdentifyDevice;
use App\Http\Middleware\RequireApiKey;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'api.key' => RequireApiKey::class,
            'device' => IdentifyDevice::class,
        ]);

        /*
         * Di belakang proxy Railway, alamat IP asli hanya ada di header
         * X-Forwarded-For. Tanpa ini seluruh permintaan terlihat berasal dari
         * satu IP dan berbagi jatah throttle:20,1 yang sama.
         */
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        /*
         * Aplikasi mobile menampilkan field `message` apa adanya, sedangkan pesan
         * bawaan Laravel untuk kasus di bawah berbahasa Inggris.
         */
        $exceptions->render(function (ThrottleRequestsException $e, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }

            $retryAfter = (int) ($e->getHeaders()['Retry-After'] ?? 60);

            return response()->json([
                'message' => "Terlalu banyak permintaan. Tunggu {$retryAfter} detik lalu coba lagi.",
            ], 429, $e->getHeaders());
        });

        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            return $request->is('api/*')
                ? response()->json(['message' => 'Alamat endpoint tidak ditemukan di server.'], 404)
                : null;
        });

        $exceptions->render(function (MethodNotAllowedHttpException $e, Request $request) {
            return $request->is('api/*')
                ? response()->json(['message' => 'Metode HTTP ini tidak didukung untuk endpoint tersebut.'], 405)
                : null;
        });
    })->create();
