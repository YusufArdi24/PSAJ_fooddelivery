<?php

namespace App\Filament\Admin\Resources\Customers\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Hash;

class CustomerForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(['default' => 1, 'sm' => 2])
            ->components([
                TextInput::make('name')
                    ->required()
                    ->maxLength(255),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required()
                    ->unique(ignoreRecord: true)
                    ->maxLength(255),
                Textarea::make('address')
                    ->label('Alamat (Lokasi Map)')
                    ->required()
                    ->columnSpanFull(),
                Select::make('address_label')
                    ->label('Label Alamat')
                    ->options([
                        'Rumah'      => 'Rumah',
                        'Apartemen'  => 'Apartemen',
                        'Kos'        => 'Kos',
                        'Kantor'     => 'Kantor',
                        'Lainnya'    => 'Lainnya',
                    ])
                    ->nullable()
                    ->placeholder('Pilih label alamat'),
                Textarea::make('address_notes')
                    ->label('Catatan Alamat')
                    ->placeholder('Contoh: Blok A No. 5, Gang Mawar, Depan warung hijau')
                    ->nullable()
                    ->maxLength(500)
                    ->columnSpanFull(),
                TextInput::make('phone')
                    ->tel()
                    ->required()
                    ->maxLength(20),
                Toggle::make('is_verified')
                    ->label('Verified Customer')
                    ->default(false),
                TextInput::make('password')
                    ->password()
                    ->required(fn ($record) => $record === null)
                    ->dehydrateStateUsing(fn ($state) => $state ? Hash::make($state) : null)
                    ->dehydrated(fn ($state) => filled($state))
                    ->maxLength(255)
                    ->helperText('Leave blank to keep current password when editing'),
            ]);
    }
}
