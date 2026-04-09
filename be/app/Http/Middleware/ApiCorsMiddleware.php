<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiCorsMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get the origin from the request
        $origin = $request->header('Origin');
        $allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://psajfooddelivery.vercel.app',
            'https://psajfooddelivery-frontend.vercel.app',
            'https://psajfooddelivery-production.up.railway.app',
        ];

        // Validate origin
        $validOrigin = $origin && in_array($origin, $allowedOrigins) ? $origin : $allowedOrigins[0];

        // Handle preflight OPTIONS request
        if ($request->getMethod() === 'OPTIONS') {
            return response('', 200)
                ->header('Access-Control-Allow-Origin', $validOrigin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Max-Age', '86400')
                ->header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        }

        $response = $next($request);

        // Add CORS headers to ALL responses (including errors)
        return $response
            ->header('Access-Control-Allow-Origin', $validOrigin)
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
            ->header('Access-Control-Allow-Credentials', 'true')
            ->header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Authorization')
            ->header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    }
}
