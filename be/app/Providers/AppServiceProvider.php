<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Menu;
use App\Models\Promo;
use App\Models\Order;
use App\Observers\MenuObserver;
use App\Observers\PromoObserver;
use App\Observers\OrderObserver;
use App\Notifications\CustomerVerifyEmail;
use Illuminate\Support\Facades\Mail;
use App\Mail\Transports\ResendTransport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register Livewire AJAX routes (for component updates)
        if (class_exists(\Livewire\Livewire::class)) {
            // Don't call Livewire::routes() here as it conflicts with our custom route
            // The custom /livewire/livewire.js route in web.php handles the script
            // Livewire update endpoint will be handled by Filament's route registration
        }

        // Register Resend mail transport
        Mail::extend('resend', function (array $config) {
            return new ResendTransport(env('RESEND_API_KEY'));
        });

        Menu::observe(MenuObserver::class);
        Promo::observe(PromoObserver::class);
        Order::observe(OrderObserver::class);

        // Custom verification URL → points to frontend
        CustomerVerifyEmail::$createUrlUsing = function ($notifiable) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
            $params = http_build_query([
                'id'      => $notifiable->getKey(),
                'hash'    => sha1($notifiable->getEmailForVerification()),
                'email'   => $notifiable->getEmailForVerification(),
            ]);
            return "{$frontendUrl}/verify-email?{$params}";
        };
    }
}
