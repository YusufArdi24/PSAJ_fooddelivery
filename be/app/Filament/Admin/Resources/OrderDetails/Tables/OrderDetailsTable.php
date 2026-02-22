<?php

namespace App\Filament\Admin\Resources\OrderDetails\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class OrderDetailsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('OrderDetailID')
                    ->label('Detail ID')
                    ->searchable()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('order.OrderID')
                    ->label('Order ID')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('order.customer.name')
                    ->label('Customer')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('menu.name')
                    ->label('Menu')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('quantity')
                    ->label('Quantity')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('price')
                    ->label('Unit Price')
                    ->money('IDR')
                    ->sortable(),
                TextColumn::make('subtotal')
                    ->label('Subtotal')
                    ->money('IDR')
                    ->getStateUsing(fn ($record) => $record->quantity * $record->price)
                    ->sortable(),
                TextColumn::make('created_at')
                    ->label('Created At')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->label('Updated At')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
