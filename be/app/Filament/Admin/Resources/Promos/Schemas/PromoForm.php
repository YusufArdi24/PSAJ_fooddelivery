<?php

namespace App\Filament\Admin\Resources\Promos\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Forms\Components\Select;
use Filament\Schemas\Schema;
use App\Models\Admin;
use App\Models\Menu;

class PromoForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'sm' => 2])
            ->components([
                Select::make('AdminID')
                    ->label('Admin')
                    ->options(Admin::pluck('name', 'AdminID'))
                    ->required()
                    ->default(function () {
                        $admin = filament()->auth()->user();
                        return $admin ? $admin->AdminID : null;
                    })
                    ->searchable()
                    ->disabled(fn () => filament()->auth()->user() !== null),
                Select::make('MenuID')
                    ->label('Menu')
                    ->options(Menu::query()->pluck('name', 'MenuID'))
                    ->required()
                    ->searchable()
                    ->helperText('Pilih menu yang akan diberi promo')
                    ->columnSpanFull(),
                TextInput::make('title')
                    ->label('Judul Promo')
                    ->required()
                    ->maxLength(255)
                    ->helperText('Contoh: Diskon Spesial, Flash Sale, dll'),
                Textarea::make('description')
                    ->label('Deskripsi')
                    ->required()
                    ->columnSpanFull(),
                Select::make('promo_type')
                    ->label('Tipe Diskon')
                    ->options([
                        'percentage' => 'Persentase (%)',
                        'fixed' => 'Fixed Amount (Rp)',
                    ])
                    ->required()
                    ->default('percentage')
                    ->reactive(),
                TextInput::make('discount_value')
                    ->label('Nilai Diskon')
                    ->required()
                    ->numeric()
                    ->minValue(0)
                    ->helperText('Masukkan angka saja (tanpa % atau Rp)'),
                DatePicker::make('start_date')
                    ->label('Tanggal Mulai')
                    ->required()
                    ->native(false),
                DatePicker::make('end_date')
                    ->label('Tanggal Berakhir')
                    ->required()
                    ->native(false)
                    ->after('start_date'),
                Toggle::make('is_active')
                    ->label('Aktif')
                    ->default(true)
                    ->helperText('Aktifkan promo sekarang'),
            ]);
    }
}
