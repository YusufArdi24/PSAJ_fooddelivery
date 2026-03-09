<?php

namespace App\Console\Commands;

use App\Models\AdminPushSubscription;
use App\Models\Order;
use App\Services\WebPushService;
use Illuminate\Console\Command;

class TestAdminPushNotification extends Command
{
    protected $signature = 'test:admin-push {order_id?}';
    protected $description = 'Test admin push notification system';

    public function handle()
    {
        $this->info('=== Testing Admin Push Notification System ===');
        $this->newLine();

        // 1. Check VAPID keys
        $this->info('1. Checking VAPID Configuration...');
        $vapidPublic = config('app.vapid_public_key');
        $vapidPrivate = config('app.vapid_private_key');
        
        if (empty($vapidPublic) || empty($vapidPrivate)) {
            $this->error('❌ VAPID keys are not configured!');
            $this->info('Run: php artisan webpush:vapid');
            return 1;
        }
        $this->info('✅ VAPID keys configured');
        $this->newLine();

        // 2. Check admin subscriptions
        $this->info('2. Checking Admin Push Subscriptions...');
        $subscriptionCount = AdminPushSubscription::count();
        $this->info("Found {$subscriptionCount} admin subscription(s)");
        
        if ($subscriptionCount === 0) {
            $this->warn('⚠️  No admin subscriptions found!');
            $this->info('To fix:');
            $this->info('  1. Login to admin panel');
            $this->info('  2. Allow browser notification permission');
            $this->info('  3. Check console for "[AdminPush] subscribed" message');
            $this->newLine();
        } else {
            $this->info('✅ Admin subscriptions exist');
            
            // Show subscription details
            $subscriptions = AdminPushSubscription::with('admin')->get();
            foreach ($subscriptions as $sub) {
                $this->info("  - Admin: {$sub->admin->name} (ID: {$sub->AdminID})");
                $this->info("    Endpoint: " . substr($sub->endpoint, 0, 50) . "...");
            }
            $this->newLine();
        }

        // 3. Test sending notification
        if ($subscriptionCount > 0) {
            $this->info('3. Testing Web Push Send...');
            
            $orderId = $this->argument('order_id');
            if ($orderId) {
                $order = Order::with('customer')->find($orderId);
                if (!$order) {
                    $this->error("Order #{$orderId} not found!");
                    return 1;
                }
            } else {
                // Get latest order
                $order = Order::with('customer')->latest('OrderID')->first();
                if (!$order) {
                    $this->error("No orders found in database!");
                    return 1;
                }
            }

            $this->info("Using Order #{$order->OrderID} from {$order->customer->name}");
            
            try {
                app(WebPushService::class)->notifyNewOrder($order);
                $this->info('✅ Push notification sent successfully!');
                $this->info('Check your browser for notification.');
            } catch (\Exception $e) {
                $this->error('❌ Failed to send push notification!');
                $this->error('Error: ' . $e->getMessage());
                $this->info('Check logs: storage/logs/laravel.log');
            }
        }

        $this->newLine();
        $this->info('=== Test Complete ===');
        return 0;
    }
}
