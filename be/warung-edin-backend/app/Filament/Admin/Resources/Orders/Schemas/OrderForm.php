<?php

namespace App\Filament\Admin\Resources\Orders\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;
use App\Models\Customer;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('CustomerID')
                    ->label('Customer')
                    ->options(Customer::pluck('name', 'CustomerID'))
                    ->required()
                    ->searchable(),
                DateTimePicker::make('order_date')
                    ->required()
                    ->default(now()),
                TextInput::make('total_price')
                    ->required()
                    ->numeric()
                    ->prefix('Rp ')
                    ->minValue(0),
                Select::make('status')
                    ->options([
                        'pending' => 'Pending',
                        'confirmed' => 'Confirmed',
                        'preparing' => 'Preparing',
                        'ready' => 'Ready',
                        'delivered' => 'Delivered',
                        'cancelled' => 'Cancelled',
                    ])
                    ->default('pending')
                    ->required(),
                Textarea::make('notes')
                    ->label('Customer Notes')
                    ->placeholder('Special requests from customer...')
                    ->columnSpanFull(),
            ]);
    }
}
