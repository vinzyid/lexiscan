<?php

namespace App\Http\Middleware;

use App\Models\Reader;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireActiveReader
{
    public function handle(Request $request, Closure $next): Response
    {
        $reader = $request->user();
        abort_unless($reader instanceof Reader && $reader->fresh()?->is_active, 403);

        return $next($request);
    }
}
