<?php

namespace App\Providers\Filament;

use Filament\Http\Middleware\Authenticate;
use Filament\Http\Middleware\AuthenticateSession;
use Filament\Http\Middleware\DisableBladeIconComponents;
use Filament\Http\Middleware\DispatchServingFilamentEvent;
use Filament\Pages\Dashboard;
use Filament\Panel;
use Filament\PanelProvider;
use Filament\Support\Colors\Color;
use Filament\Support\Facades\FilamentView;
use Filament\View\PanelsRenderHook;
use Filament\Widgets\AccountWidget;
use App\Filament\Admin\Widgets\StatsOverviewWidget;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Illuminate\Support\HtmlString;

class AdminPanelProvider extends PanelProvider
{
    public function register(): void
    {
        parent::register();

        FilamentView::registerRenderHook(
            PanelsRenderHook::HEAD_END,
            fn (): HtmlString => new HtmlString('<style>
/* Responsive Tom Select dropdown */
.ts-wrapper { position: relative; width: 100%; }
.ts-wrapper .ts-dropdown {
    width: 100% !important;
    max-width: 100% !important;
    min-width: 0 !important;
    box-sizing: border-box;
    left: 0 !important;
    right: 0 !important;
}
/* Loading bar */
#fi-loading-bar {
    position: fixed; top: 0; left: 0;
    width: 0; height: 3px;
    background: linear-gradient(to right, #f59e0b, #f97316);
    z-index: 99999;
    transition: width 0.25s ease, opacity 0.3s ease;
    opacity: 0;
    border-radius: 0 2px 2px 0;
    box-shadow: 0 0 8px rgba(245,158,11,0.7);
}
</style>')
        );

        FilamentView::registerRenderHook(
            PanelsRenderHook::BODY_END,
            fn (): HtmlString => new HtmlString('<div id="fi-loading-bar"></div>
<script>
(function(){
    var bar=document.getElementById("fi-loading-bar");
    var t=null;
    function start(){if(!bar)return;clearTimeout(t);bar.style.opacity="1";bar.style.width="70%";}
    function done(){if(!bar)return;bar.style.width="100%";t=setTimeout(function(){bar.style.opacity="0";setTimeout(function(){bar.style.width="0";},300);},200);}
    document.addEventListener("livewire:navigating",start);
    document.addEventListener("livewire:navigated",done);
    document.addEventListener("livewire:request",start);
    document.addEventListener("livewire:response",done);
})();
</script>
<script>
(function(){
    var VAPID_PUBLIC_KEY = ' . json_encode(config('app.vapid_public_key')) . ';
    var SUBSCRIBE_URL = "/admin-push/subscribe";
    var CSRF_META = document.querySelector("meta[name=csrf-token]");
    var CSRF_TOKEN = CSRF_META ? CSRF_META.getAttribute("content") : "";

    function urlBase64ToUint8Array(base64String){
        var padding="=".repeat((4-(base64String.length%4))%4);
        var base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
        var rawData=window.atob(base64);
        return Uint8Array.from(Array.from(rawData).map(function(c){return c.charCodeAt(0);}));
    }

    function saveSub(sub){
        var json=sub.toJSON();
        fetch(SUBSCRIBE_URL,{
            method:"POST",
            headers:{"Content-Type":"application/json","X-CSRF-TOKEN":CSRF_TOKEN,"Accept":"application/json"},
            body:JSON.stringify({endpoint:sub.endpoint,public_key:json.keys&&json.keys.p256dh||"",auth_token:json.keys&&json.keys.auth||""})
        }).then(function(r){if(!r.ok)console.warn("[AdminPush] subscribe failed",r.status);else console.log("[AdminPush] subscribed");});
    }

    if("serviceWorker" in navigator && "PushManager" in window && VAPID_PUBLIC_KEY){
        navigator.serviceWorker.register("/sw-admin.js",{scope:"/"}).then(function(reg){
            return navigator.serviceWorker.ready.then(function(){
                return reg.pushManager.getSubscription().then(function(existing){
                    if(existing){saveSub(existing);return;}
                    return Notification.requestPermission().then(function(perm){
                        if(perm!=="granted"){console.log("[AdminPush] permission denied");return;}
                        return reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)}).then(saveSub);
                    });
                });
            });
        }).catch(function(e){console.error("[AdminPush] SW error",e);});
    }
})();
</script>')
        );
    }

    public function panel(Panel $panel): Panel
    {
        return $panel
            ->default()
            ->id('admin')
            ->path('admin')
            ->brandName('Warung Edin')
            ->login()
            ->authGuard('admin')
            ->authPasswordBroker('admins')
            ->colors([
                'primary' => Color::Amber,
            ])
            ->sidebarCollapsibleOnDesktop()
            ->discoverResources(in: app_path('Filament/Admin/Resources'), for: 'App\Filament\Admin\Resources')
            ->discoverPages(in: app_path('Filament/Admin/Pages'), for: 'App\Filament\Admin\Pages')
            ->pages([
                Dashboard::class,
            ])
            ->discoverWidgets(in: app_path('Filament/Admin/Widgets'), for: 'App\Filament\Admin\Widgets')
            ->widgets([
                AccountWidget::class,
                StatsOverviewWidget::class,
            ])
            ->middleware([
                EncryptCookies::class,
                AddQueuedCookiesToResponse::class,
                StartSession::class,
                AuthenticateSession::class,
                ShareErrorsFromSession::class,
                VerifyCsrfToken::class,
                SubstituteBindings::class,
                DisableBladeIconComponents::class,
                DispatchServingFilamentEvent::class,
            ])
            ->authMiddleware([
                Authenticate::class,
            ]);
    }
}
