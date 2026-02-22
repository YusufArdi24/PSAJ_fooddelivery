<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Customer;
use Midtrans\Config;
use Midtrans\Snap;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey        = config('services.midtrans.server_key');
        Config::$isProduction     = config('services.midtrans.is_production');
        Config::$isSanitized      = config('services.midtrans.is_sanitized');
        Config::$is3ds            = config('services.midtrans.is_3ds');
    }

    /**
     * Create a Midtrans Snap transaction for the given payment & order.
     * Returns ['snap_token' => ..., 'redirect_url' => ..., 'midtrans_order_id' => ...]
     */
    public function createSnapTransaction(Payment $payment, Order $order, Customer $customer): array
    {
        // Unique order ID for Midtrans (must be unique per transaction attempt)
        $midtransOrderId = 'ORDER-' . $order->OrderID . '-' . time();

        // Build line items
        $items = [];
        foreach ($order->orderDetails as $detail) {
            $items[] = [
                'id'       => (string) $detail->MenuID,
                'price'    => (int) $detail->price,
                'quantity' => (int) $detail->quantity,
                'name'     => substr($detail->menu->name ?? 'Menu Item', 0, 50),
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id'     => $midtransOrderId,
                'gross_amount' => (int) $payment->amount,
            ],
            'customer_details' => [
                'first_name'   => $customer->name,
                'email'        => $customer->email,
                'phone'        => $customer->phone ?? '',
            ],
            'item_details'  => $items,
            'callbacks'     => [
                'finish' => env('FRONTEND_URL', config('app.url')) . '/payment/finish',
                'error'  => env('FRONTEND_URL', config('app.url')) . '/payment/error',
                'pending'=> env('FRONTEND_URL', config('app.url')) . '/payment/pending',
            ],
        ];

        // Restrict to specific payment method if not using QRIS / all methods
        $enabledPayments = $this->resolveEnabledPayments($payment->payment_method);
        if ($enabledPayments !== null) {
            $params['enabled_payments'] = $enabledPayments;
        }

        $snapResponse = Snap::createTransaction($params);

        return [
            'snap_token'         => $snapResponse->token,
            'redirect_url'       => $snapResponse->redirect_url,
            'midtrans_order_id'  => $midtransOrderId,
        ];
    }

    /**
     * Map our internal payment_method to Midtrans enabled_payments list.
     * Returns null to allow all methods.
     */
    private function resolveEnabledPayments(string $method): ?array
    {
        return match ($method) {
            'gopay'     => ['gopay'],
            'shopeepay' => ['shopeepay'],
            'dana'      => ['shopeepay'], // DANA uses ShopeePay channel in some integrations; adjust as needed
            'ovo'       => ['other_qris'],
            'qris'      => ['gopay', 'shopeepay', 'other_qris'],
            'bca'       => ['bca_va'],
            'bni'       => ['bni_va'],
            'bri'       => ['bri_va'],
            'mandiri'   => ['echannel'],
            'transfer'  => ['bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va', 'other_va'],
            'credit_card' => ['credit_card'],
            default     => null, // allow all
        };
    }

    /**
     * Handle incoming Midtrans notification webhook.
     * Returns the resolved payment_status string.
     */
    public function handleNotification(array $payload): string
    {
        // Verify signature
        $serverKey       = config('services.midtrans.server_key');
        $signatureKey    = hash('sha512',
            $payload['order_id'] .
            $payload['status_code'] .
            $payload['gross_amount'] .
            $serverKey
        );

        if ($signatureKey !== $payload['signature_key']) {
            throw new \Exception('Invalid Midtrans signature');
        }

        return $this->mapMidtransStatus(
            $payload['transaction_status'],
            $payload['fraud_status'] ?? null
        );
    }

    /**
     * Map Midtrans transaction_status + fraud_status → our internal payment_status.
     */
    public function mapMidtransStatus(string $transactionStatus, ?string $fraudStatus): string
    {
        if ($transactionStatus === 'capture') {
            return ($fraudStatus === 'challenge') ? 'waiting_payment' : 'paid';
        }

        return match ($transactionStatus) {
            'settlement' => 'paid',
            'pending'    => 'waiting_payment',
            'deny'       => 'failed',
            'expire'     => 'expired',
            'cancel'     => 'cancelled',
            default      => 'failed',
        };
    }
}
