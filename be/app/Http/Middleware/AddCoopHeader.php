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

        // Allow-popups for Google OAuth & popups to close properly
        $response->header('Cross-Origin-Opener-Policy', 'allow-popups');
        
        // COEP unsafe-none allows cross-origin resources (simpler, less restrictive)
        $response->header('Cross-Origin-Embedder-Policy', 'unsafe-none');

        return $response;
    }
}
