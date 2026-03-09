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
/* Admin Toast Notifications */
#admin-toast-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 99999;
    max-width: 400px;
}
.admin-toast {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    padding: 16px;
    margin-bottom: 12px;
    animation: slideInRight 0.3s ease-out;
    display: flex;
    align-items: start;
    gap: 12px;
    border-left: 4px solid #f59e0b;
}
.admin-toast.closing {
    animation: slideOutRight 0.3s ease-in forwards;
}
.admin-toast-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}
.admin-toast-icon.order {
    background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}
.admin-toast-content {
    flex: 1;
    min-width: 0;
}
.admin-toast-title {
    font-weight: 600;
    font-size: 14px;
    color: #111827;
    margin-bottom: 4px;
}
.admin-toast-body {
    font-size: 13px;
    color: #6b7280;
    line-height: 1.4;
}
.admin-toast-close {
    flex-shrink: 0;
    cursor: pointer;
    color: #9ca3af;
    font-size: 18px;
    line-height: 1;
    padding: 0 4px;
    transition: color 0.2s;
}
.admin-toast-close:hover {
    color: #4b5563;
}
@keyframes slideInRight {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
@keyframes slideOutRight {
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}
</style>')
        );

        FilamentView::registerRenderHook(
            PanelsRenderHook::BODY_END,
            fn (): HtmlString => new HtmlString('<div id="fi-loading-bar"></div>
<div id="admin-toast-container"></div>
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
// Admin Toast Notification System
(function(){
    console.log("[AdminToast] Initializing...");
    
    var toastContainer = document.getElementById("admin-toast-container");
    if (!toastContainer) {
        console.error("[AdminToast] Toast container not found!");
        return;
    }
    console.log("[AdminToast] Toast container found");
    
    var toastIdCounter = 0;
    
    // Load shown notifications from localStorage
    var STORAGE_KEY = "admin_shown_notifications";
    var shownNotifications = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    console.log("[AdminToast] Previously shown notifications:", shownNotifications);
    
    function markNotificationAsShown(notifId) {
        if (!shownNotifications.includes(notifId)) {
            shownNotifications.push(notifId);
            // Keep only last 100 notification IDs
            if (shownNotifications.length > 100) {
                shownNotifications = shownNotifications.slice(-100);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(shownNotifications));
            console.log("[AdminToast] Marked notification as shown:", notifId);
        }
    }
    
    function isNotificationShown(notifId) {
        return shownNotifications.includes(notifId);
    }
    
    window.showAdminToast = function(options) {
        console.log("[AdminToast] Showing toast:", options);
        if (!toastContainer) {
            console.error("[AdminToast] Container missing!");
            return;
        }
        
        var id = "toast-" + (++toastIdCounter);
        var icon = options.icon || "🛎️";
        var title = options.title || "Notifikasi";
        var body = options.body || "";
        var duration = options.duration || 5000;
        var onClick = options.onClick || null;
        
        var toast = document.createElement("div");
        toast.id = id;
        toast.className = "admin-toast";
        toast.innerHTML = 
            "<div class=\"admin-toast-icon order\">" + icon + "</div>" +
            "<div class=\"admin-toast-content\">" +
                "<div class=\"admin-toast-title\">" + title + "</div>" +
                "<div class=\"admin-toast-body\">" + body + "</div>" +
            "</div>" +
            "<div class=\"admin-toast-close\" onclick=\"this.parentElement.remove();\">×</div>";
        
        if (onClick) {
            toast.style.cursor = "pointer";
            toast.addEventListener("click", function(e) {
                if (!e.target.classList.contains("admin-toast-close")) {
                    onClick();
                    toast.remove();
                }
            });
        }
        
        toastContainer.appendChild(toast);
        console.log("[AdminToast] Toast added to DOM");
        
        // Auto remove
        setTimeout(function() {
            if (toast.parentElement) {
                toast.classList.add("closing");
                setTimeout(function() {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, duration);
    };
    
    // Poll for new notifications every 3 seconds (faster)
    var POLL_URL = "/admin-notifications";
    var pollInterval = null;
    
    function getCSRFToken() {
        var meta = document.querySelector("meta[name=csrf-token]");
        if (meta) return meta.getAttribute("content");
        var match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        return "";
    }
    
    function checkNewNotifications() {
        console.log("[AdminToast] Polling for notifications...");
        
        fetch(POLL_URL + "?limit=5", {
            headers: {
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            },
            credentials: "same-origin"
        })
        .then(function(r) {
            console.log("[AdminToast] Response status:", r.status);
            if (!r.ok) {
                throw new Error("HTTP " + r.status);
            }
            return r.json();
        })
        .then(function(data) {
            console.log("[AdminToast] Poll response:", data);
            
            if (data.success && data.data.notifications && data.data.notifications.length > 0) {
                // Process all unread notifications
                var newNotifications = data.data.notifications.filter(function(notif) {
                    return !isNotificationShown(notif.id);
                });
                
                console.log("[AdminToast] Found", newNotifications.length, "new notifications to show");
                
                // Show each new notification with delay
                newNotifications.forEach(function(notif, index) {
                    setTimeout(function() {
                        console.log("[AdminToast] Showing notification:", notif.id, notif.title);
                        
                        // Mark as shown BEFORE displaying to prevent duplicates
                        markNotificationAsShown(notif.id);
                        
                        // Show toast
                        showAdminToast({
                            icon: notif.type === "new_order" ? "🛎️" : "ℹ️",
                            title: notif.title,
                            body: notif.body,
                            duration: 7000,
                            onClick: function() {
                                console.log("[AdminToast] Toast clicked");
                                // Mark as read in database
                                fetch("/admin-notifications/" + notif.id + "/read", {
                                    method: "POST",
                                    headers: {
                                        "X-CSRF-TOKEN": getCSRFToken(),
                                        "Accept": "application/json",
                                        "X-Requested-With": "XMLHttpRequest"
                                    },
                                    credentials: "same-origin"
                                }).then(function() {
                                    console.log("[AdminToast] Notification marked as read");
                                });
                                
                                // Redirect to orders if it\'s a new order notification
                                if (notif.type === "new_order" && notif.data && notif.data.order_id) {
                                    window.location.href = "/admin/orders/" + notif.data.order_id + "/edit";
                                }
                            }
                        });
                    }, index * 500); // Delay 500ms between each toast
                });
            } else {
                console.log("[AdminToast] No unread notifications");
            }
        })
        .catch(function(err) {
            console.error("[AdminToast] Poll error:", err);
        });
    }
    
    // Start polling after page load
    console.log("[AdminToast] Starting polling in 1 second...");
    setTimeout(function() {
        console.log("[AdminToast] First poll...");
        checkNewNotifications();
        console.log("[AdminToast] Setting up interval (3 seconds)");
        pollInterval = setInterval(checkNewNotifications, 3000); // Poll every 3 seconds
    }, 1000);
    
    console.log("[AdminToast] Initialization complete");
})();
</script>
<script>
(function(){
    var VAPID_PUBLIC_KEY = ' . json_encode(config('app.vapid_public_key')) . ';
    var SUBSCRIBE_URL = "/admin-push/subscribe";
    
    function getCSRFToken() {

    function urlBase64ToUint8Array(base64String){
        var padding="=".repeat((4-(base64String.length%4))%4);
        var base64=(base64String+padding).replace(/-/g,"+").replace(/_/g,"/");
        var rawData=window.atob(base64);
        return Uint8Array.from(Array.from(rawData).map(function(c){return c.charCodeAt(0);}));
    }

    function saveSub(sub){
        var json=sub.toJSON();
        var CSRF_TOKEN = getCSRFToken();
        
        console.log("[AdminPush] Saving subscription...", {
            endpoint: sub.endpoint.substring(0, 50) + "...",
            hasKeys: !!(json.keys && json.keys.p256dh)
        });
        
        fetch(SUBSCRIBE_URL,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
                "X-CSRF-TOKEN":CSRF_TOKEN,
                "Accept":"application/json",
                "X-Requested-With": "XMLHttpRequest"
            },
            credentials: "same-origin",
            body:JSON.stringify({
                endpoint:sub.endpoint,
                public_key:json.keys&&json.keys.p256dh||"",
                auth_token:json.keys&&json.keys.auth||""
            })
        })
        .then(function(r){
            console.log("[AdminPush] Response status:", r.status);
            return r.json().then(function(data){
                return {ok: r.ok, status: r.status, data: data};
            });
        })
        .then(function(result){
            if(result.ok){
                console.log("[AdminPush] ✅ Subscribed successfully!", result.data);
            } else {
                console.error("[AdminPush] ❌ Subscribe failed:", result.status, result.data);
            }
        })
        .catch(function(err){
            console.error("[AdminPush] ❌ Network error:", err);
        });
    }

    function initPushNotification(){
        if(!("serviceWorker" in navigator)){
            console.warn("[AdminPush] Service Worker not supported");
            return;
        }
        if(!("PushManager" in window)){
            console.warn("[AdminPush] Push API not supported");
            return;
        }
        if(!VAPID_PUBLIC_KEY){
            console.error("[AdminPush] VAPID public key not configured");
            return;
        }
        
        console.log("[AdminPush] Initializing...");
        
        navigator.serviceWorker.register("/sw-admin.js",{scope:"/"})
            .then(function(reg){
                console.log("[AdminPush] Service Worker registered");
                return navigator.serviceWorker.ready;
            })
            .then(function(){
                console.log("[AdminPush] Service Worker ready");
                return navigator.serviceWorker.ready;
            })
            .then(function(reg){
                return reg.pushManager.getSubscription();
            })
            .then(function(existing){
                if(existing){
                    console.log("[AdminPush] Existing subscription found");
                    saveSub(existing);
                    return;
                }
                
                console.log("[AdminPush] No existing subscription, requesting permission...");
                return Notification.requestPermission().then(function(perm){
                    console.log("[AdminPush] Permission result:", perm);
                    if(perm!=="granted"){
                        console.warn("[AdminPush] Notification permission denied");
                        return;
                    }
                    
                    console.log("[AdminPush] Subscribing to push...");
                    return navigator.serviceWorker.ready.then(function(reg){
                        return reg.pushManager.subscribe({
                            userVisibleOnly:true,
                            applicationServerKey:urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                        });
                    }).then(saveSub);
                });
            })
            .catch(function(e){
                console.error("[AdminPush] Error:", e);
            });
    }
    
    // Wait for page to be fully loaded
    if(document.readyState === "complete"){
        initPushNotification();
    } else {
        window.addEventListener("load", initPushNotification);
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
