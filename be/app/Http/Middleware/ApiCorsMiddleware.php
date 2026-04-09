<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class ApiCorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');
        $allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'https://psajfooddelivery.vercel.app',
            'https://psajfooddelivery-frontend.vercel.app',
            'https://psajfooddelivery-production.up.railway.app',
            'https://warung-edin-sandy.vercel.app',
            'https://warung-edin.vercel.app',
        ];

        // Validate and set origin (never use wildcard with credentials)
        $validOrigin = (in_array($origin, $allowedOrigins)) ? $origin : null;
        
        // Log CORS requests in production for debugging
        if (app()->environment('production') && $request->getMethod() === 'OPTIONS') {
            Log::debug('CORS Preflight', [
                'origin' => $origin,
                'valid_origin' => $validOrigin,
                'path' => $request->getPathInfo(),
                'allowed_origins' => $allowedOrigins,
            ]);
        }

        // Handle OPTIONS preflight request
        if ($request->getMethod() === 'OPTIONS') {
            $headers = [
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept',
                'Access-Control-Max-Age' => '86400',
            ];
            
            if ($validOrigin) {
                $headers['Access-Control-Allow-Origin'] = $validOrigin;
                $headers['Access-Control-Allow-Credentials'] = 'true';
            }
            
            return response('', 200)->withHeaders($headers);
        }

        $response = $next($request);

        // Add CORS headers to response
        if ($validOrigin) {
            $response
                ->header('Access-Control-Allow-Origin', $validOrigin)
                ->header('Access-Control-Allow-Credentials', 'true')
                ->header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Authorization');
        }

        return $response;
    }
}
