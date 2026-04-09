<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServeLivewireJS
{
    /**
     * Handle an incoming request for Livewire JS
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only handle /livewire/livewire.js requests
        if ($request->path() === 'livewire/livewire.js') {
            return $this->serveLivewireScript();
        }

        return $next($request);
    }

    /**
     * Serve Livewire JavaScript file with multiple fallbacks
     */
    private function serveLivewireScript()
    {
        // Priority 1: Check public/vendor/livewire/livewire.js (published location)
        $vendorPublicPath = public_path('vendor/livewire/livewire.js');
        if (file_exists($vendorPublicPath)) {
            return response()->file($vendorPublicPath, [
                'Content-Type' => 'application/javascript; charset=utf-8',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }

        // Priority 2: Check public/livewire/livewire.js (alternative location)
        $publicPath = public_path('livewire/livewire.js');
        if (file_exists($publicPath)) {
            return response()->file($publicPath, [
                'Content-Type' => 'application/javascript; charset=utf-8',
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }

        // Priority 3: Check vendor directory
        $vendorSourcePaths = [
            base_path('vendor/livewire/livewire/dist/livewire.js'),
            base_path('vendor/livewire/livewire/dist/livewire.umd.js'),
        ];

        foreach ($vendorSourcePaths as $path) {
            if (file_exists($path)) {
                return response()->file($path, [
                    'Content-Type' => 'application/javascript; charset=utf-8',
                    'Cache-Control' => 'public, max-age=31536000',
                ]);
            }
        }

        // Fallback: 404 if no file found
        abort(404, 'Livewire JavaScript file not found');
    }
}
