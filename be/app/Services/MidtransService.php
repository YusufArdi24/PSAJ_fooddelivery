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
    public function createSnapTransaction(Payment $payment, Order $order, Customer $customer, ?string $paymentMethod = null): array
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

        // Restrict to specific payment method (if provided)
        // If no method specified, don't restrict - show all available methods
        $method = $paymentMethod ?? $payment->payment_method;
        
        if (!empty($method)) {
            $method = strtolower(trim($method));
            
            // Map payment method to Midtrans payment types
            // Using ONLY enabled_payments (no disabled_payments to avoid conflicts)
            if ($method === 'gopay') {
                // Direct GoPay - only GoPay
                $params['enabled_payments'] = ['gopay'];
            } 
            elseif ($method === 'ovo') {
                // Direct OVO - only OVO
                $params['enabled_payments'] = ['ovo'];
            }
            elseif ($method === 'dana') {
                // Direct DANA - only DANA
                $params['enabled_payments'] = ['dana'];
            }
            elseif ($method === 'shopeepay') {
                // Direct ShopeePay - only ShopeePay
                $params['enabled_payments'] = ['shopeepay'];
            }
            elseif ($method === 'linkaja') {
                // Direct LinkAja - only LinkAja
                $params['enabled_payments'] = ['linkaja'];
            }
            // For QRIS, show all QRIS-capable e-wallets
            elseif ($method === 'qris') {
                $params['enabled_payments'] = ['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja'];
            }
            // For bank transfer, set specific bank only
            elseif (in_array($method, ['bca', 'bni', 'bri', 'mandiri'])) {
                $bankVaMap = [
                    'bca' => 'bca_va',
                    'bni' => 'bni_va',
                    'bri' => 'bri_va',
                    'mandiri' => ['mandiri_va', 'echannel'],
                ];
                if (isset($bankVaMap[$method])) {
                    $params['enabled_payments'] = (array)$bankVaMap[$method];
                }
            }
            // If method is 'online', show all online payment methods
            elseif ($method === 'online') {
                // Don't restrict - let all methods be available
                // This allows user to select from all payment methods in Midtrans Snap
            }
        }
        // If no method specified, don't set enabled_payments - show ALL available methods

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
        // Normalize method name
        $method = strtolower(trim($method));
        
        return match ($method) {
            // E-Wallets (Direct)
            'gopay'     => ['gopay'],
            'ovo'       => ['ovo'],
            'dana'      => ['dana'],
            'shopeepay' => ['shopeepay'],
            'linkaja'   => ['linkaja'],
            
            // QRIS / QR Code (all e-wallets available)
            'qris'      => ['gopay', 'ovo', 'dana', 'shopeepay', 'linkaja'],
            
            // Bank Transfer (Virtual Account)
            'bca'       => ['bca_va'],
            'bni'       => ['bni_va'],
            'bri'       => ['bri_va'],
            'mandiri'   => ['mandiri_va', 'echannel'],
            
            // General transfer/bank options
            'transfer'  => ['bca_va', 'bni_va', 'bri_va', 'mandiri_va', 'echannel', 'permata_va', 'other_va'],
            
            // Credit Card
            'credit_card' => ['credit_card'],
            
            // Default: allow all methods
            default     => null,
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
