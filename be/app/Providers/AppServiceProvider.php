<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Menu;
use App\Models\Promo;
use App\Observers\MenuObserver;
use App\Observers\PromoObserver;
use App\Notifications\CustomerVerifyEmail;

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
        Menu::observe(MenuObserver::class);
        Promo::observe(PromoObserver::class);

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
