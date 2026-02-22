<?php

namespace App\Filament\Admin\Resources\Payments\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\DateTimePicker;
use Filament\Schemas\Schema;
use App\Models\Order;

class PaymentForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'sm' => 2])
            ->components([
                Select::make('OrderID')
                    ->label('Order')
                    ->options(Order::with('customer')->get()->pluck('customer.name', 'OrderID'))
                    ->required()
                    ->searchable(),
                Select::make('payment_method')
                    ->options([
                        'cash' => 'Cash/COD',
                        'transfer' => 'Bank Transfer',
                        'gopay' => 'GoPay',
                        'dana' => 'DANA',
                        'ovo' => 'OVO',
                        'shopeepay' => 'ShopeePay',
                        'linkaja' => 'LinkAja'
                    ])
                    ->default('cash')
                    ->required(),
                Select::make('payment_status')
                    ->options([
                        'pending' => 'Pending',
                        'paid' => 'Paid',
                        'failed' => 'Failed',
                        'refunded' => 'Refunded'
                    ])
                    ->default('pending')
                    ->required(),
                TextInput::make('amount')
                    ->required()
                    ->numeric()
                    ->prefix('Rp ')
                    ->minValue(0),
                DateTimePicker::make('payment_date')
                    ->label('Payment Date'),
            ]);
    }
}
