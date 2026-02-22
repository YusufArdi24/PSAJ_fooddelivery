<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use App\Services\MidtransService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    /**
     * Create a Midtrans Snap transaction for an existing payment/order.
     * Used for all non-COD payment methods.
     * POST /api/v1/payment/snap/create
     */
    public function createSnapTransaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|integer|exists:orders,OrderID',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $order = Order::with(['orderDetails.menu', 'payment'])
            ->where('OrderID', $request->order_id)
            ->where('CustomerID', $request->user()->CustomerID)
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found',
            ], 404);
        }

        $payment = $order->payment;

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment record not found for this order',
            ], 404);
        }

        // COD / Cash does not need Midtrans
        if (in_array($payment->payment_method, ['cash', 'cod'])) {
            return response()->json([
                'success' => false,
                'message' => 'COD / Cash orders do not require online payment',
            ], 422);
        }

        // Already paid
        if ($payment->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'This order has already been paid',
            ], 422);
        }

        try {
            $midtrans = new MidtransService();
            $snapData = $midtrans->createSnapTransaction($payment, $order, $request->user());

            // Save snap token & midtrans order ID to payment record
            $payment->update([
                'snap_token'        => $snapData['snap_token'],
                'midtrans_order_id' => $snapData['midtrans_order_id'],
                'redirect_url'      => $snapData['redirect_url'],
                'payment_status'    => 'waiting_payment',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Snap transaction created',
                'data'    => [
                    'snap_token'        => $snapData['snap_token'],
                    'redirect_url'      => $snapData['redirect_url'],
                    'midtrans_order_id' => $snapData['midtrans_order_id'],
                    'client_key'        => config('services.midtrans.client_key'),
                    'snap_js_url'       => config('services.midtrans.snap_url'),
                    'payment_id'        => $payment->PaymentID,
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Midtrans Snap error: ' . $e->getMessage(), [
                'order_id'   => $order->OrderID,
                'payment_id' => $payment->PaymentID,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment transaction: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Midtrans payment notification webhook (called by Midtrans server).
     * POST /api/v1/payment/notification
     * Must be PUBLIC (no auth) and excluded from CSRF protection.
     */
    public function handleNotification(Request $request)
    {
        try {
            $payload = $request->all();

            if (empty($payload['order_id'])) {
                return response()->json(['success' => false, 'message' => 'Invalid payload'], 400);
            }

            // Find payment by midtrans_order_id
            $payment = Payment::where('midtrans_order_id', $payload['order_id'])->first();

            if (!$payment) {
                Log::warning('Midtrans notification: payment not found', ['order_id' => $payload['order_id']]);
                return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
            }

            $midtrans  = new MidtransService();
            $newStatus = $midtrans->handleNotification($payload);

            $updateData = [
                'payment_status'    => $newStatus,
                'payment_reference' => $payload['transaction_id'] ?? $payment->payment_reference,
                'payment_details'   => array_merge(
                    (array) ($payment->payment_details ?? []),
                    [
                        'midtrans_transaction_status' => $payload['transaction_status'] ?? null,
                        'midtrans_payment_type'       => $payload['payment_type'] ?? null,
                        'midtrans_fraud_status'       => $payload['fraud_status'] ?? null,
                        'midtrans_va_numbers'         => $payload['va_numbers'] ?? null,
                        'midtrans_actions'            => $payload['actions'] ?? null,
                    ]
                ),
            ];

            if ($newStatus === 'paid') {
                $updateData['paid_at'] = now();
                $payment->order->update(['status' => 'confirmed']);
            } elseif (in_array($newStatus, ['expired', 'cancelled', 'failed'])) {
                if ($payment->order->status === 'pending') {
                    $payment->order->update(['status' => 'cancelled']);
                }
            }

            $payment->update($updateData);

            Log::info('Midtrans notification processed', [
                'midtrans_order_id' => $payload['order_id'],
                'status'            => $newStatus,
            ]);

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            Log::error('Midtrans notification error: ' . $e->getMessage(), $request->all());

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: manually update payment status.
     * PUT /api/v1/admin/payments/{id}/status
     */
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'payment_status'    => 'required|in:pending,paid,failed,cancelled,waiting_payment,expired,refunded',
            'payment_reference' => 'nullable|string|max:255',
            'notes'             => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        $updateData = [
            'payment_status'    => $request->payment_status,
            'payment_reference' => $request->payment_reference,
            'notes'             => $request->notes,
        ];

        if ($request->payment_status === 'paid') {
            $updateData['paid_at'] = now();
            $payment->order->update(['status' => 'confirmed']);
        }

        $payment->update($updateData);
        $payment->load('order');

        return response()->json([
            'success' => true,
            'message' => 'Payment status updated successfully',
            'data'    => $payment,
        ]);
    }

    /**
     * Show a single payment.
     * GET /api/v1/admin/payments/{id}
     */
    public function show($id)
    {
        $payment = Payment::with('order')->find($id);

        if (!$payment) {
            return response()->json(['success' => false, 'message' => 'Payment not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $payment]);
    }

    /**
     * Return available payment methods with Midtrans info.
     * GET /api/v1/payment-methods
     */
    public function getPaymentMethods()
    {
        $snapUrl   = config('services.midtrans.snap_url');
        $clientKey = config('services.midtrans.client_key');

        $paymentMethods = [
            [
                'key'          => 'cod',
                'name'         => 'Cash on Delivery (COD)',
                'description'  => 'Bayar tunai saat pesanan tiba',
                'type'         => 'offline',
                'use_midtrans' => false,
                'icon'         => 'cash',
            ],
            [
                'key'          => 'gopay',
                'name'         => 'GoPay',
                'description'  => 'Bayar dengan GoPay',
                'type'         => 'ewallet',
                'use_midtrans' => true,
                'icon'         => 'gopay',
            ],
            [
                'key'          => 'shopeepay',
                'name'         => 'ShopeePay',
                'description'  => 'Bayar dengan ShopeePay',
                'type'         => 'ewallet',
                'use_midtrans' => true,
                'icon'         => 'shopeepay',
            ],
            [
                'key'          => 'dana',
                'name'         => 'DANA',
                'description'  => 'Bayar dengan DANA',
                'type'         => 'ewallet',
                'use_midtrans' => true,
                'icon'         => 'dana',
            ],
            [
                'key'          => 'ovo',
                'name'         => 'OVO',
                'description'  => 'Bayar dengan OVO',
                'type'         => 'ewallet',
                'use_midtrans' => true,
                'icon'         => 'ovo',
            ],
            [
                'key'          => 'qris',
                'name'         => 'QRIS',
                'description'  => 'Scan QR Code dari berbagai dompet digital',
                'type'         => 'qr_code',
                'use_midtrans' => true,
                'icon'         => 'qris',
            ],
            [
                'key'          => 'bca',
                'name'         => 'Virtual Account BCA',
                'description'  => 'Transfer via BCA Virtual Account',
                'type'         => 'bank_transfer',
                'use_midtrans' => true,
                'icon'         => 'bca',
            ],
            [
                'key'          => 'bni',
                'name'         => 'Virtual Account BNI',
                'description'  => 'Transfer via BNI Virtual Account',
                'type'         => 'bank_transfer',
                'use_midtrans' => true,
                'icon'         => 'bni',
            ],
            [
                'key'          => 'bri',
                'name'         => 'Virtual Account BRI',
                'description'  => 'Transfer via BRI Virtual Account',
                'type'         => 'bank_transfer',
                'use_midtrans' => true,
                'icon'         => 'bri',
            ],
            [
                'key'          => 'mandiri',
                'name'         => 'Mandiri Bill Payment',
                'description'  => 'Bayar via Mandiri e-channel / ATM',
                'type'         => 'bank_transfer',
                'use_midtrans' => true,
                'icon'         => 'mandiri',
            ],
        ];

        return response()->json([
            'success'  => true,
            'data'     => $paymentMethods,
            'midtrans' => [
                'client_key' => $clientKey,
                'snap_url'   => $snapUrl,
            ],
        ]);
    }
}
