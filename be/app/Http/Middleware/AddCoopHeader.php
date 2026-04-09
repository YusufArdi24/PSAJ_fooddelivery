<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddCoopHeader
{
    /**
     * Add Cross-Origin-Opener-Policy header to ALL responses
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Add COOP header to all responses - this allows Google OAuth popups to work
        $response->header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

        return $response;
    }
}
