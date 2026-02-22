<?php

namespace App\Filament\Admin\Pages\Auth;

use Filament\Forms\Components\TextInput;
use Filament\Actions\Action;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Support\Facades\Password;

class RequestPasswordReset extends Page implements HasForms
{
    use InteractsWithForms;

    protected static bool $shouldRegisterNavigation = false;
    
    public ?array $data = [];
    
    protected string $view = 'filament.pages.auth.request-password-reset';

    public function mount(): void
    {
        $this->form->fill();
    }

    protected function getFormSchema(): array
    {
        return [
            TextInput::make('email')
                ->label('Email address')
                ->email()
                ->required()
                ->autocomplete()
                ->autofocus(),
        ];
    }

    protected function getFormStatePath(): string
    {
        return 'data';
    }

    public function request(): void
    {
        try {
            $data = $this->form->getState();

            $status = Password::broker('admins')->sendResetLink($data);

            if ($status === Password::RESET_LINK_SENT) {
                Notification::make()
                    ->success()
                    ->title('Password reset link sent!')
                    ->body('We have emailed your password reset link.')
                    ->send();

                $this->form->fill();
            } else {
                Notification::make()
                    ->danger()
                    ->title('Error!')
                    ->body('We cannot find a user with that email address.')
                    ->send();
            }
        } catch (\Exception $e) {
            Notification::make()
                ->danger()
                ->title('Error!')
                ->body('Please check your input.')
                ->send();
        }
    }

    protected function getActions(): array
    {
        return [
            Action::make('request')
                ->label('Send password reset email')
                ->submit('request'),
        ];
    }
}