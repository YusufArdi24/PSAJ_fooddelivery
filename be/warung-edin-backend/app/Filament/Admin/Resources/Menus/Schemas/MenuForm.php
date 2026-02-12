<?php

namespace App\Filament\Admin\Resources\Menus\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;
use App\Models\Admin;

class MenuForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('AdminID')
                    ->label('Admin')
                    ->options(Admin::pluck('name', 'AdminID'))
                    ->required()
                    ->default(function () {
                        return auth('admin')->user()->AdminID;
                    })
                    ->searchable(),
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                Textarea::make('description')
                    ->required()
                    ->columnSpanFull(),
                TextInput::make('price')
                    ->required()
                    ->numeric()
                    ->prefix('Rp ')
                    ->minValue(0),
                Select::make('category')
                    ->options([
                        'appetizer' => 'Appetizer',
                        'main' => 'Main Course',
                        'dessert' => 'Dessert',
                        'drink' => 'Drink',
                        'snack' => 'Snack'
                    ])
                    ->required()
                    ->default('main'),
                FileUpload::make('image')
                    ->label('Menu Image')
                    ->image()
                    ->directory('menu-images')
                    ->columnSpanFull(),
                Toggle::make('is_available')
                    ->label('Available')
                    ->default(true),
            ]);
    }
}
