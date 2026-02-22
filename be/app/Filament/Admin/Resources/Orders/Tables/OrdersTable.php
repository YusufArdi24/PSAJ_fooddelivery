<?php

namespace App\Filament\Admin\Resources\Orders\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class OrdersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('OrderID')
                    ->label('Order ID')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('customer.name')
                    ->label('Customer')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('customer.address')
                    ->label('Alamat Pengantaran')
                    ->searchable()
                    ->wrap()
                    ->limit(60)
                    ->tooltip(function (TextColumn $column): ?string {
                        $state = $column->getState();
                        if (strlen($state) <= 60) {
                            return null;
                        }
                        return $state;
                    })
                    ->visibleFrom('xl'),
                TextColumn::make('customer.phone')
                    ->label('No. Telepon')
                    ->searchable()
                    ->visibleFrom('lg'),
                TextColumn::make('order_date')
                    ->label('Order Date')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->visibleFrom('md'),
                TextColumn::make('total_price')
                    ->label('Total (Setelah Diskon)')
                    ->getStateUsing(function ($record) {
                        $record->loadMissing('orderDetails.menu.activePromo');
                        $total = 0;
                        foreach ($record->orderDetails as $detail) {
                            if ($detail->original_price === null) {
                                // Old order — compute discount live from activePromo
                                $originalPrice = $detail->menu ? (float) $detail->menu->price : 0;
                                $discount = ($detail->menu && $detail->menu->activePromo)
                                    ? (float) $detail->menu->activePromo->calculateDiscount($originalPrice)
                                    : 0;
                                $total += ($originalPrice - $discount) * $detail->quantity;
                            } else {
                                // New order — stored price is already discounted
                                $total += (float) $detail->price * $detail->quantity;
                            }
                        }
                        return $total;
                    })
                    ->money('IDR'),
                TextColumn::make('discount_amount')
                    ->label('Diskon')
                    ->money('IDR')
                    ->sortable()
                    ->color('danger')
                    ->formatStateUsing(fn ($state) => $state > 0 ? '-Rp ' . number_format($state, 0, ',', '.') : '-')
                    ->toggleable(),
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->colors([
                        'pending' => 'info',
                        'confirmed' => 'warning',
                        'preparing' => 'warning',
                        'ready' => 'success',
                        'delivered' => 'success',
                        'cancelled' => 'danger',
                    ])
                    ->sortable(),
                TextColumn::make('notes')
                    ->label('Notes')
                    ->limit(50)
                    ->tooltip(function (TextColumn $column): ?string {
                        $state = $column->getState();
                        if (strlen($state) <= 50) {
                            return null;
                        }
                        return $state;
                    })
                    ->searchable()
                    ->toggleable(),
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
