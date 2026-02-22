<?php

namespace App\Filament\Admin\Resources\Menus\Schemas;

use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TagsInput;
use Filament\Schemas\Schema;

class MenuForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'sm' => 2])
            ->components([
                Hidden::make('AdminID')
                    ->default(function () {
                        return auth('admin')->user()->AdminID;
                    }),
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
                        'makanan' => 'Makanan',
                        'minuman' => 'Minuman',
                        'lainnya' => 'Lainnya'
                    ])
                    ->required()
                    ->default('makanan'),
                FileUpload::make('image')
                    ->label('Menu Image')
                    ->image()
                    ->disk('public')
                    ->directory('menu-images')
                    ->visibility('public')
                    ->columnSpanFull(),
                TagsInput::make('variants')
                    ->label('Varian Menu')
                    ->helperText('Ketik varian lalu tekan Enter. Contoh: Goreng, Kuah, Bakar')
                    ->placeholder('Tambah varian...')
                    ->columnSpanFull()
                    ->nullable(),
                Toggle::make('is_available')
                    ->label('Available')
                    ->default(true),
            ]);
    }
}
