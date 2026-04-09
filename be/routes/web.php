<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminPushSubscriptionController;
use App\Http\Controllers\AdminNotificationController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\DebugRevenueController;
use Illuminate\Support\Facades\Response;

Route::get('/', function () {
    return view('welcome');
});

// Livewire routes - must be defined before other routes
Livewire\Livewire::routes();

// Storage files with CORS support
Route::middleware(['storage.cors'])->group(function () {
    Route::get('/storage/{path}', function ($path) {
        $filePath = storage_path('app/public/' . $path);
        
        if (!file_exists($filePath)) {
            abort(404);
        }
        
        $file = file_get_contents($filePath);
        $type = mime_content_type($filePath);
        
        return Response::make($file, 200, [
            'Content-Type' => $type,
            'Content-Length' => filesize($filePath),
        ]);
    })->where('path', '.*');
});

// Debug route (remove in production)
Route::get('/admin/debug/revenue', [DebugRevenueController::class, 'index']);

// Admin Web Push subscription (session-based, CSRF protected)
Route::middleware(['web', 'auth:admin'])->group(function () {
    Route::post('/admin-push/subscribe', [AdminPushSubscriptionController::class, 'subscribe'])->name('admin.push.subscribe');
    Route::post('/admin-push/unsubscribe', [AdminPushSubscriptionController::class, 'unsubscribe'])->name('admin.push.unsubscribe');
    
    // Admin notifications
    Route::get('/admin-notifications', [AdminNotificationController::class, 'index'])->name('admin.notifications.index');
    Route::get('/admin-notifications/all', [AdminNotificationController::class, 'all'])->name('admin.notifications.all');
    Route::post('/admin-notifications/{id}/read', [AdminNotificationController::class, 'markAsRead'])->name('admin.notifications.read');
    Route::post('/admin-notifications/read-all', [AdminNotificationController::class, 'markAllAsRead'])->name('admin.notifications.read-all');
    Route::delete('/admin-notifications/{id}', [AdminNotificationController::class, 'destroy'])->name('admin.notifications.destroy');
    
    // Admin reports
    Route::get('/admin/reports/orders-summary', [ReportController::class, 'ordersSummary'])->name('admin.reports.orders-summary');
});

// Admin password reset routes for Filament
Route::get('/admin/auth/password-reset/request', \App\Filament\Admin\Pages\Auth\RequestPasswordReset::class)
    ->middleware('guest:admin')
    ->name('filament.admin.auth.password-reset.request');

Route::get('/admin/reset-password/{token}', \App\Filament\Admin\Pages\Auth\ResetPassword::class)
    ->middleware('guest:admin')
    ->name('filament.admin.auth.password-reset.reset');
