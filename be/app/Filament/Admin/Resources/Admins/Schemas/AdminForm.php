<?php

namespace App\Filament\Admin\Resources\Admins\Schemas;

use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;
use Illuminate\Support\Facades\Hash;

class AdminForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
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
                TextInput::make('phone')
                    ->tel()
                    ->required()
                    ->maxLength(20),
                TextInput::make('password')
                    ->password()
                    ->required(fn ($record) => $record === null) // Required only for new records
                    ->dehydrateStateUsing(fn ($state) => $state ? Hash::make($state) : null)
                    ->dehydrated(fn ($state) => filled($state))
                    ->maxLength(255)
                    ->helperText('Leave blank to keep current password when editing'),
            ]);
    }
}
