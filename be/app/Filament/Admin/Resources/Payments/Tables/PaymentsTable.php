<?php

namespace App\Filament\Admin\Resources\Payments\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PaymentsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('PaymentID')
                    ->label('Payment ID')
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
                TextColumn::make('order.total_price')
                    ->label('Order Total')
                    ->money('IDR')
                    ->sortable()
                    ->visibleFrom('lg'),
                TextColumn::make('amount')
                    ->label('Payment Amount')
                    ->money('IDR')
                    ->sortable(),
                TextColumn::make('payment_method')
                    ->label('Payment Method')
                    ->badge()
                    ->colors([
                        'cash' => 'info',
                        'cod' => 'info', 
                        'transfer' => 'warning',
                        'gopay' => 'success',
                        'dana' => 'success',
                        'ovo' => 'primary',
                        'linkaja' => 'danger',
                        'shopeepay' => 'secondary',
                        'qris' => 'success',
                        'bca' => 'primary',
                        'mandiri' => 'warning',
                        'bni' => 'info',
                        'bri' => 'primary',
                        'e-wallet' => 'success',
                        'credit_card' => 'secondary',
                    ])
                    ->searchable()
                    ->sortable(),
                TextColumn::make('payment_status')
                    ->label('Status')
                    ->badge()
                    ->colors([
                        'pending' => 'info',
                        'waiting_payment' => 'warning',
                        'paid' => 'success',
                        'failed' => 'danger',
                        'refunded' => 'warning',
                    ])
                    ->sortable(),
                TextColumn::make('payment_reference')
                    ->label('Reference')
                    ->searchable()
                    ->toggleable(),
                TextColumn::make('payment_details')
                    ->label('Payment Details')
                    ->limit(50)
                    ->tooltip(function (TextColumn $column): ?string {
                        $state = $column->getState();
                        if (is_array($state)) {
                            $state = json_encode($state, JSON_PRETTY_PRINT);
                        }
                        if (strlen($state) <= 50) {
                            return null;
                        }
                        return $state;
                    })
                    ->formatStateUsing(function ($state) {
                        if (is_array($state)) {
                            return json_encode($state);
                        }
                        return $state;
                    })
                    ->toggleable(),
                TextColumn::make('paid_at')
                    ->label('Paid At')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->visibleFrom('md'),
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
