<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'customer' => \App\Http\Middleware\CustomerMiddleware::class,
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'storage.cors' => \App\Http\Middleware\StorageCorsMiddleware::class,
        ]);
        
        // Apply API CORS middleware to all API routes
        $middleware->append(\App\Http\Middleware\ApiCorsMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (\Throwable $exception) {
            // Add CORS/COOP headers to error responses
            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 500)
                ->header('Access-Control-Allow-Origin', '*')
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
                ->header('Cross-Origin-Opener-Policy', 'unsafe-none')
                ->header('Cross-Origin-Embedder-Policy', 'unsafe-none');
        });
    })->create();
