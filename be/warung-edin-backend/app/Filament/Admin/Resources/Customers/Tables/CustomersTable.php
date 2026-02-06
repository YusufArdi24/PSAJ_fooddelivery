<?php

namespace App\Filament\Admin\Resources\Customers\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Table;
use Filament\Support\Icons\Heroicon;
use Filament\Notifications\Notification;

class CustomersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('CustomerID')
                    ->label('ID')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('name')
                    ->label('Name')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('email')
                    ->label('Email Address')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('address')
                    ->label('Address')
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
                TextColumn::make('phone')
                    ->label('Phone Number')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('email_verified_at')
                    ->label('Email Verified')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('Not Verified')
                    ->badge()
                    ->color(fn ($state) => $state ? 'success' : 'warning')
                    ->formatStateUsing(fn ($state) => $state ? $state->format('d/m/Y H:i') : 'Not Verified')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('is_verified')
                    ->label('Account Status')
                    ->badge()
                    ->formatStateUsing(fn ($state) => $state ? 'Verified' : 'Unverified')
                    ->colors([
                        'Verified' => 'success',
                        'Unverified' => 'warning',
                    ])
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
                Action::make('toggle_verification')
                    ->label('Toggle Account Status')
                    ->icon('heroicon-o-shield-check')
                    ->color('warning')
                    ->action(function ($record) {
                        $record->is_verified = !$record->is_verified;
                        $record->save();
                        
                        $status = $record->is_verified ? 'verified' : 'unverified';
                        Notification::make()
                            ->title("Customer account {$status} successfully")
                            ->success()
                            ->send();
                    })
                    ->requiresConfirmation()
                    ->modalHeading('Toggle Customer Account Status')
                    ->modalDescription('Are you sure you want to change the account verification status of this customer?'),
                Action::make('toggle_email_verification')
                    ->label('Toggle Email Verification')
                    ->icon('heroicon-o-envelope-open')
                    ->color('info')
                    ->action(function ($record) {
                        if ($record->email_verified_at) {
                            $record->email_verified_at = null;
                        } else {
                            $record->email_verified_at = now();
                        }
                        $record->save();
                        
                        $status = $record->email_verified_at ? 'verified' : 'unverified';
                        Notification::make()
                            ->title("Customer email {$status} successfully")
                            ->success()
                            ->send();
                    })
                    ->requiresConfirmation()
                    ->modalHeading('Toggle Customer Email Verification')
                    ->modalDescription('Are you sure you want to change the email verification status of this customer?'),
                Action::make('send_verification_email')
                    ->label('Send Verification Email')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('success')
                    ->action(function ($record) {
                        if ($record->email_verified_at) {
                            Notification::make()
                                ->title('Email already verified')
                                ->warning()
                                ->send();
                            return;
                        }
                        
                        try {
                            $record->sendEmailVerificationNotification();
                            Notification::make()
                                ->title('Verification email sent successfully')
                                ->success()
                                ->send();
                        } catch (\Exception $e) {
                            Notification::make()
                                ->title('Failed to send verification email')
                                ->danger()
                                ->send();
                        }
                    })
                    ->requiresConfirmation()
                    ->modalHeading('Send Verification Email')
                    ->modalDescription('This will send a verification link to the customer\'s email address.'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
