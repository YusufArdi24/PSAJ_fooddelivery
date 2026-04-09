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
        // Trust proxies for HTTPS on Railway
        $middleware->trustProxies(
            '*',
            Illuminate\Http\Request::HEADER_X_FORWARDED_FOR |
            Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO |
            Illuminate\Http\Request::HEADER_X_FORWARDED_HOST
        );

        $middleware->alias([
            'customer' => \App\Http\Middleware\CustomerMiddleware::class,
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'storage.cors' => \App\Http\Middleware\StorageCorsMiddleware::class,
        ]);
        
        // Add COOP header to ALL responses (OAuth popup fix)
        $middleware->append(\App\Http\Middleware\AddCoopHeader::class);
        
        // Apply API CORS middleware to all API routes
        $middleware->append(\App\Http\Middleware\ApiCorsMiddleware::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
