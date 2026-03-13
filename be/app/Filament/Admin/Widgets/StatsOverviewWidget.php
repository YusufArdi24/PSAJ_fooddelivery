<?php

namespace App\Filament\Admin\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use App\Models\Customer;
use App\Models\Order;
use Carbon\Carbon;

class StatsOverviewWidget extends BaseWidget
{
    protected function getColumns(): int
    {
        return 4;
    }
    
    protected function getStats(): array
    {
        $totalCustomers = Customer::count();
        $verifiedCustomers = Customer::where('is_verified', true)->count();
        $totalOrders = Order::count();
        $completedOrders = Order::where('status', 'delivered')->count();
        
        // Calculate revenue for different periods (only delivered/completed orders)
        // Use Order.total_price which already includes discount calculation
        // This ensures accurate revenue reporting with discounts applied
        $revenueToday = Order::where('status', 'delivered')
            ->where('hidden_from_admin', false)
            ->whereDate('order_date', Carbon::today())
            ->sum('total_price');
            
        $revenueThisMonth = Order::where('status', 'delivered')
            ->where('hidden_from_admin', false)
            ->whereMonth('order_date', Carbon::now()->month)
            ->whereYear('order_date', Carbon::now()->year)
            ->sum('total_price');
            
        $revenueThisYear = Order::where('status', 'delivered')
            ->where('hidden_from_admin', false)
            ->whereYear('order_date', Carbon::now()->year)
            ->sum('total_price');
        
        $pendingOrders = Order::where('status', 'pending')->count();
        
        return [
            Stat::make('Total Customers', $totalCustomers)
                ->description('Registered customers')
                ->descriptionIcon('heroicon-m-users')
                ->color('success'),
                
            Stat::make('Verified Customers', $verifiedCustomers)
                ->description($verifiedCustomers . '/' . $totalCustomers . ' verified')
                ->descriptionIcon('heroicon-m-shield-check')
                ->color('warning'),
                
            Stat::make('Total Orders', $totalOrders)
                ->description('All time orders')
                ->descriptionIcon('heroicon-m-shopping-bag')
                ->color('info'),
                
            Stat::make('Completed Orders', $completedOrders)
                ->description('Successfully delivered')
                ->descriptionIcon('heroicon-m-check-circle')
                ->color('success'),
                
            Stat::make('Pendapatan Hari Ini', 'Rp ' . number_format($revenueToday))
                ->description(Carbon::today()->format('d M Y'))
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),
                
            Stat::make('Pendapatan Bulan Ini', 'Rp ' . number_format($revenueThisMonth))
                ->description(Carbon::now()->format('F Y'))
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),
                
            Stat::make('Pendapatan Tahun Ini', 'Rp ' . number_format($revenueThisYear))
                ->description(Carbon::now()->format('Y'))
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),
                
            Stat::make('Pending Orders', $pendingOrders)
                ->description('Needs attention')
                ->descriptionIcon('heroicon-m-clock')
                ->color('danger'),
        ];
    }
}