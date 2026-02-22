<?php

namespace App\Filament\Admin\Resources\Carts\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;
use App\Models\Customer;
use App\Models\Menu;

class CartForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('CustomerID')
                    ->label('Customer')
                    ->options(Customer::pluck('name', 'CustomerID'))
                    ->required()
                    ->searchable()
                    ->disabled(fn ($record) => $record !== null),
                Select::make('MenuID')
                    ->label('Menu')
                    ->options(Menu::pluck('name', 'MenuID'))
                    ->required()
                    ->searchable()
                    ->disabled(fn ($record) => $record !== null),
                TextInput::make('quantity')
                    ->required()
                    ->numeric()
                    ->minValue(1),
                TextInput::make('price')
                    ->required()
                    ->numeric()
                    ->prefix('Rp ')
                    ->disabled(fn ($record) => $record !== null)
                    ->helperText('Price is automatically set from menu'),
            ]);
    }
}
