<?php

namespace App\Filament\Admin\Resources\Orders\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Filament\Tables\Filters\SelectFilter;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

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
                TextColumn::make('delivery_address')
                    ->label('Alamat Pengantaran')
                    ->getStateUsing(function ($record) {
                        // Use delivery address from order, fallback to customer default address
                        $address = $record->delivery_address ?? $record->customer?->address ?? 'Tidak ada alamat';
                        $label = $record->delivery_address_label ?? '';
                        return $label ? "[$label] $address" : $address;
                    })
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
                TextColumn::make('original_total')
                    ->label('Harga Normal')
                    ->getStateUsing(function ($record) {
                        $record->loadMissing('orderDetails.menu.activePromo');
                        $total = 0;
                        foreach ($record->orderDetails as $detail) {
                            if ($detail->original_price === null) {
                                // Old order — use current menu price
                                $originalPrice = $detail->menu ? (float) $detail->menu->price : 0;
                            } else {
                                // New order — use stored original price
                                $originalPrice = (float) $detail->original_price;
                            }
                            $total += $originalPrice * $detail->quantity;
                        }
                        return $total;
                    })
                    ->money('IDR')
                    ->visibleFrom('lg'),
                TextColumn::make('discount_total')
                    ->label('Diskon')
                    ->getStateUsing(function ($record) {
                        $record->loadMissing('orderDetails.menu.activePromo');
                        $discount = 0;
                        foreach ($record->orderDetails as $detail) {
                            if ($detail->original_price === null) {
                                // Old order — compute discount from activePromo
                                $originalPrice = $detail->menu ? (float) $detail->menu->price : 0;
                                $discountPerItem = ($detail->menu && $detail->menu->activePromo)
                                    ? (float) $detail->menu->activePromo->calculateDiscount($originalPrice)
                                    : 0;
                            } else {
                                // New order — use stored discount
                                $discountPerItem = (float) $detail->discount_per_item;
                            }
                            $discount += $discountPerItem * $detail->quantity;
                        }
                        return $discount;
                    })
                    ->money('IDR')
                    ->color('danger')
                    ->formatStateUsing(fn ($state) => $state > 0 ? '-Rp ' . number_format($state, 0, ',', '.') : '-')
                    ->visibleFrom('lg'),
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
                TextColumn::make('status')
                    ->label('Status')
                    ->badge()
                    ->colors([
                        'warning' => 'pending',
                        'info' => 'confirmed',
                        'success' => 'delivered',
                    ])
                    ->formatStateUsing(fn ($state) => match($state) {
                        'pending' => 'Pending (Menunggu)',
                        'confirmed' => 'Dikonfirmasi',
                        'delivered' => 'Diantar / Selesai',
                        default => $state
                    })
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
                SelectFilter::make('period')
                    ->label('Periode Waktu')
                    ->options([
                        'today' => 'Hari Ini',
                        'this_month' => 'Bulan Ini',
                        'this_year' => 'Tahun Ini',
                        'all' => 'Semua',
                    ])
                    ->default('all')
                    ->query(function (Builder $query, array $data) {
                        if (!isset($data['value']) || $data['value'] === 'all') {
                            return $query;
                        }
                        
                        return match ($data['value']) {
                            'today' => $query->whereDate('order_date', Carbon::today()),
                            'this_month' => $query->whereMonth('order_date', Carbon::now()->month)
                                                  ->whereYear('order_date', Carbon::now()->year),
                            'this_year' => $query->whereYear('order_date', Carbon::now()->year),
                            default => $query,
                        };
                    }),
                SelectFilter::make('status')
                    ->label('Status')
                    ->options([
                        'pending' => 'Pending (Menunggu)',
                        'confirmed' => 'Dikonfirmasi',
                        'delivered' => 'Diantar / Selesai',
                    ]),
            ])
            ->recordActions([
                EditAction::make(),
                Action::make('hide')
                    ->label('Hapus dari View Admin')
                    ->icon('heroicon-o-eye-slash')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->modalHeading('Hapus Order dari View Admin?')
                    ->modalDescription('Order ini akan disembunyikan dari panel admin, tapi customer masih bisa melihatnya.')
                    ->action(function ($record) {
                        $record->update(['hidden_from_admin' => true]);
                    }),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
