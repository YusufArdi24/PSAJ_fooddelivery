<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'payment_status' => 'required|in:pending,paid,failed,cancelled,waiting_payment,expired',
            'payment_reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $payment = Payment::find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        $updateData = [
            'payment_status' => $request->payment_status,
            'payment_reference' => $request->payment_reference,
            'notes' => $request->notes,
        ];

        // Set paid_at timestamp if status is paid
        if ($request->payment_status === 'paid') {
            $updateData['paid_at'] = now();
            
            // Update order status to confirmed
            $payment->order->update(['status' => 'confirmed']);
        }

        $payment->update($updateData);

        $payment->load('order');

        return response()->json([
            'success' => true,
            'message' => 'Payment status updated successfully',
            'data' => $payment
        ]);
    }

    public function show($id)
    {
        $payment = Payment::with('order')->find($id);

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payment
        ]);
    }

    public function getPaymentMethods()
    {
        $paymentMethods = [
            'cash' => [
                'name' => 'Cash',
                'description' => 'Bayar tunai saat pesanan diantar',
                'type' => 'offline'
            ],
            'cod' => [
                'name' => 'Cash on Delivery (COD)',
                'description' => 'Bayar saat pesanan diterima',
                'type' => 'offline'
            ],
            'transfer' => [
                'name' => 'Transfer Bank',
                'description' => 'Transfer ke rekening warung',
                'type' => 'bank_transfer'
            ],
            'gopay' => [
                'name' => 'GoPay',
                'description' => 'Bayar dengan GoPay',
                'type' => 'ewallet'
            ],
            'dana' => [
                'name' => 'DANA',
                'description' => 'Bayar dengan DANA',
                'type' => 'ewallet'
            ],
            'ovo' => [
                'name' => 'OVO',
                'description' => 'Bayar dengan OVO',
                'type' => 'ewallet'
            ],
            'linkaja' => [
                'name' => 'LinkAja',
                'description' => 'Bayar dengan LinkAja',
                'type' => 'ewallet'
            ],
            'shopeepay' => [
                'name' => 'ShopeePay',
                'description' => 'Bayar dengan ShopeePay',
                'type' => 'ewallet'
            ],
            'qris' => [
                'name' => 'QRIS',
                'description' => 'Scan QR Code untuk bayar',
                'type' => 'qr_code'
            ],
            'bca' => [
                'name' => 'BCA',
                'description' => 'Transfer via BCA',
                'type' => 'bank_transfer'
            ],
            'mandiri' => [
                'name' => 'Bank Mandiri',
                'description' => 'Transfer via Bank Mandiri',
                'type' => 'bank_transfer'
            ],
            'bni' => [
                'name' => 'BNI',
                'description' => 'Transfer via BNI',
                'type' => 'bank_transfer'
            ],
            'bri' => [
                'name' => 'BRI',
                'description' => 'Transfer via BRI',
                'type' => 'bank_transfer'
            ]
        ];

        return response()->json([
            'success' => true,
            'data' => $paymentMethods
        ]);
    }
}