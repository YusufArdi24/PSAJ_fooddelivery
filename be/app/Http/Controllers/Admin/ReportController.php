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
        $filterType = $request->get('filter_type', 'preset');
        $query = Order::with(['customer', 'orderDetails.menu.activePromo'])
            ->where('hidden_from_admin', false);

        // Apply date filters
        $title = 'Semua Waktu';
        
        if ($filterType === 'date_range') {
            // Custom date range filter
            $startDate = $request->get('start_date');
            $endDate = $request->get('end_date');
            
            if ($startDate && $endDate) {
                $startDate = Carbon::parse($startDate)->startOfDay();
                $endDate = Carbon::parse($endDate)->endOfDay();
                
                $query->whereBetween('order_date', [$startDate, $endDate]);
                
                $startFormatted = $startDate->locale('id')->format('d F Y');
                $endFormatted = $endDate->locale('id')->format('d F Y');
                $title = "$startFormatted sampai $endFormatted";
            }
        } elseif ($filterType === 'month_range') {
            // Month range filter
            $startMonth = $request->get('start_month');
            $endMonth = $request->get('end_month');
            $year = $request->get('month_year');
            
            if ($startMonth && $endMonth && $year) {
                $startDate = Carbon::createFromDate($year, $startMonth, 1)->startOfDay();
                $endDate = Carbon::createFromDate($year, $endMonth, 1)->endOfMonth()->endOfDay();
                
                $query->whereBetween('order_date', [$startDate, $endDate]);
                
                $monthNames = [
                    '01' => 'Januari', '02' => 'Februari', '03' => 'Maret',
                    '04' => 'April', '05' => 'Mei', '06' => 'Juni',
                    '07' => 'Juli', '08' => 'Agustus', '09' => 'September',
                    '10' => 'Oktober', '11' => 'November', '12' => 'Desember',
                ];
                
                $startMonthName = $monthNames[$startMonth] ?? '';
                $endMonthName = $monthNames[$endMonth] ?? '';
                $title = "$startMonthName - $endMonthName $year";
            }
        } elseif ($filterType === 'year_range') {
            // Year range filter
            $startYear = $request->get('start_year');
            $endYear = $request->get('end_year');
            
            if ($startYear && $endYear) {
                $startDate = Carbon::createFromDate($startYear, 1, 1)->startOfDay();
                $endDate = Carbon::createFromDate($endYear, 12, 31)->endOfDay();
                
                $query->whereBetween('order_date', [$startDate, $endDate]);
                
                $title = "$startYear - $endYear";
            }
        } else {
            // Preset period filter
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
            
            $filename = 'laporan-pesanan-';
            
            if ($filterType === 'preset') {
                $filename .= strtolower(str_replace(' ', '-', $period));
            } elseif ($filterType === 'date_range') {
                $startDate = Carbon::parse($request->get('start_date'))->format('Y-m-d');
                $endDate = Carbon::parse($request->get('end_date'))->format('Y-m-d');
                $filename .= "custom-{$startDate}-ke-{$endDate}";
            } elseif ($filterType === 'month_range') {
                $startMonth = $request->get('start_month');
                $endMonth = $request->get('end_month');
                $year = $request->get('month_year');
                $filename .= "bulan-{$startMonth}-ke-{$endMonth}-{$year}";
            } elseif ($filterType === 'year_range') {
                $startYear = $request->get('start_year');
                $endYear = $request->get('end_year');
                $filename .= "tahun-{$startYear}-ke-{$endYear}";
            }
            
            $filename .= '-' . date('Y-m-d') . '.pdf';
            
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
