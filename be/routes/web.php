<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminPushSubscriptionController;

Route::get('/', function () {
    return view('welcome');
});

// Admin Web Push subscription (session-based, CSRF protected)
Route::middleware(['web', 'auth:admin'])->group(function () {
    Route::post('/admin-push/subscribe', [AdminPushSubscriptionController::class, 'subscribe'])->name('admin.push.subscribe');
    Route::post('/admin-push/unsubscribe', [AdminPushSubscriptionController::class, 'unsubscribe'])->name('admin.push.unsubscribe');
});

// Admin password reset routes for Filament
Route::get('/admin/auth/password-reset/request', \App\Filament\Admin\Pages\Auth\RequestPasswordReset::class)
    ->middleware('guest:admin')
    ->name('filament.admin.auth.password-reset.request');

Route::get('/admin/reset-password/{token}', \App\Filament\Admin\Pages\Auth\ResetPassword::class)
    ->middleware('guest:admin')
    ->name('filament.admin.auth.password-reset.reset');
