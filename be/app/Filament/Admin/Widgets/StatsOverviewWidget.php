<?php

namespace App\Filament\Admin\Widgets;

use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Menu;
use App\Models\Payment;

class StatsOverviewWidget extends BaseWidget
{
    protected function getStats(): array
    {
        $totalCustomers = Customer::count();
        $verifiedCustomers = Customer::where('is_verified', true)->count();
        $totalOrders = Order::count();
        $totalRevenue = Payment::where('payment_status', 'paid')->sum('amount');
        $pendingOrders = Order::where('status', 'pending')->count();
        $availableMenus = Menu::where('is_available', true)->count();
        
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
                
            Stat::make('Total Revenue', 'Rp ' . number_format($totalRevenue))
                ->description('Paid orders only')
                ->descriptionIcon('heroicon-m-banknotes')
                ->color('success'),
                
            Stat::make('Pending Orders', $pendingOrders)
                ->description('Needs attention')
                ->descriptionIcon('heroicon-m-clock')
                ->color('danger'),
                
            Stat::make('Available Menus', $availableMenus)
                ->description('Currently available')
                ->descriptionIcon('heroicon-m-list-bullet')
                ->color('primary'),
        ];
    }
}