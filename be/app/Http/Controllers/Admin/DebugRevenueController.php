<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DebugRevenueController extends Controller
{
    public function index()
    {
        $data = [];
        
        // Basic counts
        $data['total_orders'] = Order::count();
        $data['delivered_orders'] = Order::where('status', 'delivered')->count();
        $data['total_payments'] = Payment::count();
        $data['paid_payments'] = Payment::where('payment_status', 'paid')->count();
        
        // Check all payment statuses
        $data['payment_statuses'] = Payment::select('payment_status', DB::raw('count(*) as count'))
            ->groupBy('payment_status')
            ->get()
            ->pluck('count', 'payment_status')
            ->toArray();
        
        // Check all order statuses
        $data['order_statuses'] = Order::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get()
            ->pluck('count', 'status')
            ->toArray();
        
        // Get sample payments with their orders
        $data['sample_payments'] = Payment::with('order')
            ->limit(5)
            ->get()
            ->map(function($payment) {
                return [
                    'payment_id' => $payment->PaymentID,
                    'order_id' => $payment->OrderID,
                    'payment_status' => $payment->payment_status,
                    'order_status' => $payment->order ? $payment->order->status : null,
                    'amount' => $payment->amount,
                    'order_date' => $payment->order ? $payment->order->order_date->format('Y-m-d') : null,
                ];
            });
        
        // Check delivered orders with paid payments
        $deliveredWithPayment = Order::where('status', 'delivered')
            ->where('hidden_from_admin', false)
            ->whereHas('payment', function($q) {
                $q->where('payment_status', 'paid');
            })
            ->with('payment')
            ->get();
        
        $data['delivered_with_payment_count'] = $deliveredWithPayment->count();
        $data['delivered_orders_list'] = $deliveredWithPayment->map(function($order) {
            return [
                'order_id' => $order->OrderID,
                'order_date' => $order->order_date->format('Y-m-d H:i:s'),
                'order_date_human' => $order->order_date->format('d M Y'),
                'status' => $order->status,
                'payment_status' => $order->payment->payment_status,
                'amount' => $order->payment->amount,
                'amount_formatted' => 'Rp ' . number_format($order->payment->amount),
            ];
        });
        
        // Revenue calculations
        $data['revenue_today'] = Payment::whereHas('order', function ($query) {
                $query->where('status', 'delivered')
                      ->where('hidden_from_admin', false)
                      ->whereDate('order_date', Carbon::today());
            })
            ->sum('amount');
            
        $data['revenue_this_month'] = Payment::whereHas('order', function ($query) {
                $query->where('status', 'delivered')
                      ->where('hidden_from_admin', false)
                      ->whereMonth('order_date', Carbon::now()->month)
                      ->whereYear('order_date', Carbon::now()->year);
            })
            ->sum('amount');
            
        $data['revenue_this_year'] = Payment::whereHas('order', function ($query) {
                $query->where('status', 'delivered')
                      ->where('hidden_from_admin', false)
                      ->whereYear('order_date', Carbon::now()->year);
            })
            ->sum('amount');
        
        // Debug: Get all delivered orders with payments
        $data['delivered_orders_detail'] = Order::where('status', 'delivered')
            ->where('hidden_from_admin', false)
            ->with('payment')
            ->get()
            ->map(function($order) {
                return [
                    'order_id' => $order->OrderID,
                    'order_date' => $order->order_date->format('Y-m-d H:i:s'),
                    'hidden_from_admin' => $order->hidden_from_admin,
                    'status' => $order->status,
                    'payment_id' => $order->payment ? $order->payment->PaymentID : null,
                    'payment_status' => $order->payment ? $order->payment->payment_status : null,
                    'amount' => $order->payment ? $order->payment->amount : 0,
                ];
            });
        
        // Date info
        $data['today'] = Carbon::today()->format('Y-m-d');
        $data['current_month'] = Carbon::now()->format('F Y');
        $data['current_year'] = Carbon::now()->year;
        
        return response()->json([
            'success' => true,
            'data' => $data,
        ], 200);
    }
}
