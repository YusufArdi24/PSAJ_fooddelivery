<?php

namespace App\Services;

use App\Models\AdminNotification;
use App\Models\AdminPushSubscription;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;
use Illuminate\Support\Facades\Log;

class WebPushService
{
    protected WebPush $webPush;

    public function __construct()
    {
        $publicKey = config('app.vapid_public_key');
        $privateKey = config('app.vapid_private_key');
        $subject = config('app.vapid_subject');

        if (empty($publicKey) || empty($privateKey)) {
            Log::error('[WebPush] VAPID keys not configured');
            // Don't throw exception, just log it
            // throw new \Exception('VAPID keys not configured. Run: php artisan webpush:vapid');
        }

        try {
            $this->webPush = new WebPush([
                'VAPID' => [
                    'subject'    => $subject,
                    'publicKey'  => trim($publicKey),
                    'privateKey' => trim($privateKey),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('[WebPush] Failed to initialize WebPush', [
                'error' => $e->getMessage(),
                'public_key_length' => strlen($publicKey),
                'private_key_length' => strlen($privateKey),
            ]);
            // Don't throw, just log
        }
    }

    /**
     * Send in-app notification and web push notification to admins
     *
     * @param array $data ['title', 'body', 'type', 'data' => [...]]
     * @param int|null $adminId Specific admin ID or null for all admins
     * @return void
     */
    public function notifyAdmins(array $data, ?int $adminId = null): void
    {
        $type = $data['type'] ?? 'general';
        $title = $data['title'] ?? 'Notifikasi Admin';
        $body = $data['body'] ?? '';
        $notificationData = $data['data'] ?? [];

        // 1. Store in-app notification (ALWAYS DO THIS)
        AdminNotification::create([
            'AdminID' => $adminId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'data' => $notificationData,
        ]);

        Log::info('[WebPush] In-app notification created', [
            'type' => $type,
            'adminId' => $adminId,
        ]);

        // 2. Try to send web push notifications (optional, may fail)
        try {
            $subscriptions = $adminId 
                ? AdminPushSubscription::where('AdminID', $adminId)->get()
                : AdminPushSubscription::all();

            if ($subscriptions->isEmpty()) {
                Log::info('[WebPush] No admin subscriptions found', ['adminId' => $adminId]);
                return;
            }

            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'icon' => '/favicon.ico',
                'badge' => '/favicon.ico',
                'data' => array_merge($notificationData, ['type' => $type]),
            ]);

            foreach ($subscriptions as $sub) {
                try {
                    $subscription = Subscription::create([
                        'endpoint'        => $sub->endpoint,
                        'publicKey'       => $sub->public_key,
                        'authToken'       => $sub->auth_token,
                        'contentEncoding' => 'aesgcm',
                    ]);

                    $this->webPush->queueNotification($subscription, $payload);
                } catch (\Exception $e) {
                    Log::error('[WebPush] Failed to queue notification', [
                        'error' => $e->getMessage(),
                        'subscription_id' => $sub->id,
                    ]);
                }
            }

            // Flush all queued notifications
            foreach ($this->webPush->flush() as $report) {
                if (!$report->isSuccess()) {
                    $endpoint = $report->getRequest()->getUri()->__toString();
                    
                    Log::warning('[WebPush] Failed to send', [
                        'endpoint' => $endpoint,
                        'reason' => $report->getReason(),
                        'expired' => $report->isSubscriptionExpired(),
                    ]);

                    // Remove expired subscriptions
                    if ($report->isSubscriptionExpired()) {
                        AdminPushSubscription::where('endpoint', $endpoint)->delete();
                        Log::info('[WebPush] Deleted expired subscription', ['endpoint' => $endpoint]);
                    }
                } else {
                    Log::info('[WebPush] Push notification sent successfully');
                }
            }
        } catch (\Exception $e) {
            // Web push failed, but in-app notification is already saved
            Log::warning('[WebPush] Web push failed, but in-app notification saved', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notify all admins about a new order
     *
     * @param \App\Models\Order $order
     * @return void
     */
    public function notifyNewOrder($order): void
    {
        $this->notifyAdmins([
            'title' => '🛎️ Pesanan Baru!',
            'body' => "Pesanan #{$order->OrderID} dari {$order->customer->name} - {$order->formattedTotalPrice}",
            'type' => 'new_order',
            'data' => [
                'order_id' => $order->OrderID,
                'customer_name' => $order->customer->name,
                'total_price' => (string) $order->total_price,
            ],
        ]);
    }
}
