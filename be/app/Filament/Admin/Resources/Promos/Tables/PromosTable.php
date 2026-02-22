<?php

namespace App\Filament\Admin\Resources\Promos\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class PromosTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('PromoID')
                    ->label('ID')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('admin.name')
                    ->label('Admin')
                    ->searchable()
                    ->sortable()
                    ->visibleFrom('xl'),
                TextColumn::make('menu.name')
                    ->label('Menu')
                    ->searchable()
                    ->sortable()
                    ->visibleFrom('md'),
                TextColumn::make('title')
                    ->label('Judul Promo')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('promo_type')
                    ->label('Tipe')
                    ->badge()
                    ->colors([
                        'percentage' => 'success',
                        'fixed' => 'primary',
                    ])
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'percentage' => 'Persentase',
                        'fixed' => 'Fixed',
                        default => $state,
                    })
                    ->sortable(),
                TextColumn::make('formatted_discount')
                    ->label('Diskon')
                    ->sortable(query: function ($query, $direction) {
                        return $query->orderBy('discount_value', $direction);
                    }),
                TextColumn::make('start_date')
                    ->label('Mulai')
                    ->date()
                    ->sortable()
                    ->visibleFrom('md'),
                TextColumn::make('end_date')
                    ->label('Berakhir')
                    ->date()
                    ->sortable()
                    ->visibleFrom('md'),
                IconColumn::make('is_active')
                    ->label('Aktif')
                    ->boolean()
                    ->sortable(),
                ImageColumn::make('image')
                    ->label('Banner')
                    ->circular()
                    ->toggleable(),
                TextColumn::make('created_at')
                    ->label('Dibuat')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
