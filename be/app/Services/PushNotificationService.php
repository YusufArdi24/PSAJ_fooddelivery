<?php

namespace App\Services;

use App\Models\AdminPushSubscription;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    private WebPush $webPush;

    public function __construct()
    {
        $auth = [
            'VAPID' => [
                'subject'    => config('app.vapid_subject', 'mailto:admin@warungedin.com'),
                'publicKey'  => config('app.vapid_public_key'),
                'privateKey' => config('app.vapid_private_key'),
            ],
        ];

        $this->webPush = new WebPush($auth);
    }

    /**
     * Send a push notification to all subscriptions of a customer.
     */
    public function sendToCustomer(int $customerId, string $title, string $body, array $data = []): void
    {
        $subscriptions = PushSubscription::where('CustomerID', $customerId)->get();
        $this->dispatchToSubscriptions($subscriptions, $title, $body, $data);
    }

    /**
     * Send a push notification to all admin subscriptions.
     */
    public function sendToAllAdmins(string $title, string $body, array $data = []): void
    {
        $subscriptions = AdminPushSubscription::all();
        $this->dispatchToSubscriptions($subscriptions, $title, $body, $data, true);
    }

    /**
     * Internal: queue and flush notifications for a collection of subscriptions.
     */
    private function dispatchToSubscriptions($subscriptions, string $title, string $body, array $data, bool $isAdmin = false): void
    {
        if ($subscriptions->isEmpty()) {
            return;
        }

        $icon   = $isAdmin ? '/favicon.ico' : '/warungedin.png';
        $payload = json_encode([
            'title' => $title,
            'body'  => $body,
            'icon'  => $icon,
            'badge' => $icon,
            'data'  => $data,
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
                Log::warning('[PushNotification] Queue failed: ' . $e->getMessage());
            }
        }

        foreach ($this->webPush->flush() as $report) {
            if (!$report->isSuccess() && $report->isSubscriptionExpired()) {
                $endpoint = (string) $report->getRequest()->getUri();
                if ($isAdmin) {
                    AdminPushSubscription::where('endpoint', $endpoint)->delete();
                } else {
                    PushSubscription::where('endpoint', $endpoint)->delete();
                }
            }
        }
    }
}
