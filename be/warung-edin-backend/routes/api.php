<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\CustomerVerificationController;
use App\Http\Controllers\Api\AdminVerificationController;
use App\Http\Controllers\Api\TestEmailController;

Route::prefix('v1')->group(function () {
    
    // Public routes
    Route::post('/customers/register', [AuthController::class, 'customerRegister']);
    Route::post('/customers/login', [AuthController::class, 'customerLogin']);
    Route::post('/customers/forgot-password', [AuthController::class, 'customerForgotPassword']);
    Route::post('/customers/reset-password', [AuthController::class, 'customerResetPassword']);
    
    // Admin routes
    Route::post('/admin/register', [AuthController::class, 'adminRegister']);
    Route::post('/admin/login', [AuthController::class, 'adminLogin']);
    Route::post('/admin/forgot-password', [AuthController::class, 'adminForgotPassword']);
    Route::post('/admin/reset-password', [AuthController::class, 'adminResetPassword']);
    
    // Public menu routes
    Route::get('/menus', [MenuController::class, 'index']);
    Route::get('/menus/{id}', [MenuController::class, 'show']);
    Route::get('/menus/category/{category}', [MenuController::class, 'byCategory']);
    
    // Public payment methods
    Route::get('/payment-methods', [PaymentController::class, 'getPaymentMethods']);
    
    // Email verification routes
    Route::get('/customers/email/verify/{id}/{hash}', [CustomerVerificationController::class, 'verify'])
        ->middleware(['signed'])
        ->name('customers.verification.verify');
        
    Route::post('/customers/email/resend', [CustomerVerificationController::class, 'resend'])
        ->name('customers.verification.send');
        
    Route::get('/admin/email/verify/{id}/{hash}', [AdminVerificationController::class, 'verify'])
        ->middleware(['signed'])
        ->name('admin.verification.verify');
        
    Route::post('/admin/email/resend', [AdminVerificationController::class, 'resend'])
        ->name('admin.verification.send');
    
    // Test email routes (remove in production)
    Route::get('/test/customer-email', [TestEmailController::class, 'testCustomerEmail']);
    Route::get('/test/admin-email', [TestEmailController::class, 'testAdminEmail']);
    
    // Protected customer routes
    Route::middleware(['auth:sanctum', 'customer'])->group(function () {
        Route::get('/customer/profile', [AuthController::class, 'customerProfile']);
        Route::put('/customer/profile', [AuthController::class, 'updateCustomerProfile']);
        Route::post('/customer/logout', [AuthController::class, 'customerLogout']);
        Route::post('/customer/change-password', [AuthController::class, 'customerChangePassword']);
        
        // Cart routes
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart', [CartController::class, 'store']);
        Route::put('/cart/{id}', [CartController::class, 'update']);
        Route::delete('/cart/{id}', [CartController::class, 'destroy']);
        Route::post('/cart/clear', [CartController::class, 'clear']);
        Route::post('/cart/checkout', [CartController::class, 'checkout']);
        
        // Order routes for customers
        Route::get('/orders', [OrderController::class, 'customerOrders']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::put('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    });
    
    // Protected admin routes
    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('/admin/profile', [AuthController::class, 'adminProfile']);
        Route::put('/admin/profile', [AuthController::class, 'updateAdminProfile']);
        Route::post('/admin/change-password', [AuthController::class, 'adminChangePassword']);
        Route::post('/admin/logout', [AuthController::class, 'adminLogout']);
        
        // Admin order management
        Route::get('/admin/orders', [OrderController::class, 'adminOrders']);
        Route::put('/admin/orders/{id}/status', [OrderController::class, 'updateStatus']);
        
        // Admin payment management
        Route::get('/admin/payments/{id}', [PaymentController::class, 'show']);
        Route::put('/admin/payments/{id}/status', [PaymentController::class, 'updateStatus']);
        
        // Admin customer management
        Route::get('/admin/customers', [UserController::class, 'index']);
        Route::post('/admin/customers', [UserController::class, 'store']);
        Route::get('/admin/customers/{id}', [UserController::class, 'show']);
        Route::put('/admin/customers/{id}', [UserController::class, 'update']);
        Route::delete('/admin/customers/{id}', [UserController::class, 'destroy']);
        Route::post('/admin/customers/{id}/toggle-verification', [UserController::class, 'toggleVerification']);
        Route::get('/admin/customers-statistics', [UserController::class, 'statistics']);
        
        // Admin management
        Route::get('/admin/admins', [UserController::class, 'getAllAdmins']);
        Route::delete('/admin/admins/{id}', [UserController::class, 'deleteAdmin']);
    });
    
});