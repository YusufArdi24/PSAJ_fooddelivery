<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Admin password reset routes for Filament
Route::get('/admin/auth/password-reset/request', \App\Filament\Admin\Pages\Auth\RequestPasswordReset::class)
    ->middleware('guest:admin')
    ->name('filament.admin.auth.password-reset.request');

Route::get('/admin/reset-password/{token}', \App\Filament\Admin\Pages\Auth\ResetPassword::class)
    ->middleware('guest:admin')
    ->name('filament.admin.auth.password-reset.reset');
