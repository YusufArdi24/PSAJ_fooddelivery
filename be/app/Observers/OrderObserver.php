<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\Notification;
use App\Services\PushNotificationService;
use App\Services\WebPushService;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    /**
     * Handle the Order "created" event.
     * Send notification to admins when new order is placed.
     */
    public function created(Order $order): void
    {
        Log::info('OrderObserver: New order created', [
            'order_id' => $order->OrderID,
            'customer_id' => $order->CustomerID,
        ]);

        // Send web push notification to all admins
        try {
            $order->loadMissing('customer');
            app(WebPushService::class)->notifyNewOrder($order);

            Log::info('OrderObserver: Admin notification sent', [
                'order_id' => $order->OrderID,
            ]);
        } catch (\Exception $e) {
            Log::error('OrderObserver: Failed to notify admins', [
                'error' => $e->getMessage(),
                'order_id' => $order->OrderID,
            ]);
        }
    }

    /**
     * Handle the Order "updated" event.
     * Send notification to customer when order status changes.
     */
    public function updated(Order $order): void
    {
        // Check if status was actually changed
        if (!$order->wasChanged('status')) {
            return;
        }

        $oldStatus = $order->getOriginal('status');
        $newStatus = $order->status;

        Log::info('OrderObserver: Status changed', [
            'order_id' => $order->OrderID,
            'old_status' => $oldStatus,
            'new_status' => $newStatus,
        ]);

        // Auto-update payment status to 'paid' when order is delivered
        if ($newStatus === 'delivered') {
            $payment = $order->payment;
            if ($payment && $payment->payment_status !== 'paid') {
                $payment->payment_status = 'paid';
                $payment->paid_at = now();
                $payment->save();
                
                Log::info('OrderObserver: Payment status updated to paid', [
                    'order_id' => $order->OrderID,
                    'payment_id' => $payment->PaymentID,
                ]);
            }
        }

        // Load order details to create menu summary
        $order->loadMissing('orderDetails.menu');
        $menuNames = $order->orderDetails->take(2)->map(fn($d) => $d->menu?->name ?? 'Menu')->toArray();
        $menuSummary = implode(', ', $menuNames);
        if ($order->orderDetails->count() > 2) {
            $menuSummary .= ' dan ' . ($order->orderDetails->count() - 2) . ' menu lainnya';
        }

        // Define notification messages for each status
        $notifications = [
            'pending' => [
                'title' => '⏳ Pesanan Menunggu Konfirmasi',
                'message' => "Pesanan #{$order->OrderID} ({$menuSummary}) sedang menunggu konfirmasi dari kami."
            ],
            'confirmed' => [
                'title' => '✅ Pesanan Dikonfirmasi!',
                'message' => "Yeay! Pesanan #{$order->OrderID} ({$menuSummary}) sudah dikonfirmasi dan sedang diproses. Mohon ditunggu ya!"
            ],
            'delivered' => [
                'title' => '🎉 Pesanan Diantar / Selesai',
                'message' => "Pesanan #{$order->OrderID} ({$menuSummary}) sudah diantar! Selamat menikmati makanannya. Terima kasih sudah order! 😋"
            ],
        ];

        if (!isset($notifications[$newStatus])) {
            return;
        }

        $notifData = $notifications[$newStatus];

        // Create database notification
        try {
            Notification::createForCustomer(
                $order->CustomerID,
                'order_status',
                $notifData['title'],
                $notifData['message'],
                $order->OrderID
            );

            Log::info('OrderObserver: Database notification created', [
                'order_id' => $order->OrderID,
                'customer_id' => $order->CustomerID,
            ]);
        } catch (\Exception $e) {
            Log::error('OrderObserver: Failed to create notification', [
                'error' => $e->getMessage(),
                'order_id' => $order->OrderID,
            ]);
        }

        // Send web push notification
        try {
            app(PushNotificationService::class)->sendToCustomer(
                $order->CustomerID,
                $notifData['title'],
                $notifData['message'],
                ['type' => 'order_status', 'order_id' => $order->OrderID]
            );

            Log::info('OrderObserver: Push notification sent', [
                'order_id' => $order->OrderID,
                'customer_id' => $order->CustomerID,
            ]);
        } catch (\Exception $e) {
            Log::warning('OrderObserver: Push notification failed', [
                'error' => $e->getMessage(),
                'order_id' => $order->OrderID,
            ]);
        }
    }
}
