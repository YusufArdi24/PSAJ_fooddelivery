<?php

namespace App\Filament\Admin\Resources\Menus\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MenusTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('MenuID')
                    ->label('ID')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('admin.name')
                    ->label('Admin')
                    ->searchable()
                    ->sortable()
                    ->visibleFrom('lg'),
                TextColumn::make('name')
                    ->label('Menu Name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('description')
                    ->label('Description')
                    ->searchable()
                    ->limit(50)
                    ->tooltip(function (TextColumn $column): ?string {
                        $state = $column->getState();
                        if (strlen($state) <= 50) {
                            return null;
                        }
                        return $state;
                    })
                    ->toggleable(),
                TextColumn::make('price')
                    ->money('IDR')
                    ->sortable(),
                TextColumn::make('category')
                    ->badge()
                    ->colors([
                        'makanan' => 'success',
                        'minuman' => 'info',
                        'lainnya' => 'warning',
                    ])
                    ->searchable()
                    ->sortable()
                    ->visibleFrom('sm'),
                ImageColumn::make('image')
                    ->label('Image')
                    ->circular()
                    ->visibleFrom('md')
                    ->toggleable(),
                TextColumn::make('image_type')
                    ->label('Image Type')
                    ->badge()
                    ->color('secondary')
                    ->toggleable(isToggledHiddenByDefault: true),
                IconColumn::make('is_available')
                    ->label('Available')
                    ->boolean()
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
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
