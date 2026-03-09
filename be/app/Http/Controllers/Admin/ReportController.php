<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    /**
     * Generate orders summary report
     */
    public function ordersSummary(Request $request)
    {
        $period = $request->get('period', 'all');
        $query = Order::with(['customer', 'orderDetails.menu.activePromo'])
            ->where('hidden_from_admin', false);

        // Apply date filters
        $title = 'Semua Waktu';
        switch ($period) {
            case 'today':
                $query->whereDate('order_date', Carbon::today());
                $title = 'Hari Ini - ' . Carbon::today()->format('d/m/Y');
                break;
            case 'this_month':
                $query->whereMonth('order_date', Carbon::now()->month)
                      ->whereYear('order_date', Carbon::now()->year);
                $title = 'Bulan ' . Carbon::now()->locale('id')->monthName . ' ' . Carbon::now()->year;
                break;
            case 'this_year':
                $query->whereYear('order_date', Carbon::now()->year);
                $title = 'Tahun ' . Carbon::now()->year;
                break;
        }

        $orders = $query->orderBy('order_date', 'desc')->get();

        // Calculate totals with dynamic price calculation
        $totalOrdersAll = $orders->count();
        $totalOrdersCompleted = $orders->where('status', 'delivered')->count();
        $totalRevenue = 0;
        $totalDiscountCompleted = 0;
        $totalDiscountAll = 0;

        foreach ($orders as $order) {
            $orderTotal = 0;
            $orderOriginalTotal = 0;
            $orderDiscount = 0;
            
            foreach ($order->orderDetails as $detail) {
                if ($detail->original_price === null) {
                    // Old order — compute discount live from activePromo
                    $originalPrice = $detail->menu ? (float) $detail->menu->price : 0;
                    $discount = ($detail->menu && $detail->menu->activePromo)
                        ? (float) $detail->menu->activePromo->calculateDiscount($originalPrice)
                        : 0;
                    $orderTotal += ($originalPrice - $discount) * $detail->quantity;
                    $orderOriginalTotal += $originalPrice * $detail->quantity;
                    $orderDiscount += $discount * $detail->quantity;
                } else {
                    // New order — stored price is already discounted
                    $orderTotal += (float) $detail->price * $detail->quantity;
                    $orderOriginalTotal += (float) $detail->original_price * $detail->quantity;
                    $orderDiscount += (float) $detail->discount_per_item * $detail->quantity;
                }
            }
            
            // Store calculated values for display
            $order->calculated_total = $orderTotal;
            $order->calculated_original_total = $orderOriginalTotal;
            $order->calculated_discount = $orderDiscount;
            
            // Add to total discount for all orders
            $totalDiscountAll += $orderDiscount;
            
            // Only include delivered orders in revenue and completed discount
            if ($order->status === 'delivered') {
                $totalRevenue += $orderTotal;
                $totalDiscountCompleted += $orderDiscount;
            }
        }

        // Check if download PDF is requested
        if ($request->get('download')) {
            $pdf = Pdf::loadView('admin.reports.orders-summary', compact(
                'orders',
                'title',
                'totalOrdersAll',
                'totalOrdersCompleted',
                'totalRevenue',
                'totalDiscountCompleted',
                'totalDiscountAll'
            ))
            ->setPaper('a4', 'portrait')
            ->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'sans-serif'
            ]);
            
            $filename = 'laporan-pesanan-' . strtolower(str_replace(' ', '-', $period)) . '-' . date('Y-m-d') . '.pdf';
            return $pdf->download($filename);
        }

        return view('admin.reports.orders-summary', compact(
            'orders',
            'title',
            'totalOrdersAll',
            'totalOrdersCompleted',
            'totalRevenue',
            'totalDiscountCompleted',
            'totalDiscountAll'
        ));
    }
}
