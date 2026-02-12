<?php

namespace App\Filament\Admin\Pages\Auth;

use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\TextInput;
use Filament\Actions\Action;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class ResetPassword extends Page implements HasForms
{
    use InteractsWithForms;

    protected static bool $shouldRegisterNavigation = false;
    
    public ?array $data = [];
    
    protected string $view = 'filament.pages.auth.reset-password';

    public function mount(): void
    {
        $this->form->fill([
            'email' => request()->query('email'),
            'token' => request()->route('token'),
        ]);
    }

    protected function getFormSchema(): array
    {
        return [
            Hidden::make('token')
                ->required(),
            TextInput::make('email')
                ->label('Email address')
                ->email()
                ->required()
                ->disabled(),
            TextInput::make('password')
                ->label('New password')
                ->password()
                ->required()
                ->minLength(8)
                ->maxLength(255),
            TextInput::make('passwordConfirmation')
                ->label('Confirm new password')
                ->password()
                ->required()
                ->same('password')
                ->minLength(8)
                ->maxLength(255),
        ];
    }

    protected function getFormStatePath(): string
    {
        return 'data';
    }

    public function resetPassword(): void
    {
        try {
            $data = $this->form->getState();

            $status = Password::broker('admins')->reset(
                [
                    'email' => $data['email'],
                    'password' => $data['password'],
                    'password_confirmation' => $data['passwordConfirmation'],
                    'token' => $data['token'],
                ],
                function ($user, $password) {
                    $user->forceFill([
                        'password' => Hash::make($password),
                        'remember_token' => Str::random(60),
                    ])->save();

                    event(new PasswordReset($user));
                }
            );

            if ($status === Password::PASSWORD_RESET) {
                Notification::make()
                    ->success()
                    ->title('Password reset successfully!')
                    ->body('Your password has been reset. You can now log in with your new password.')
                    ->send();

                redirect()->to('/admin');
            } else {
                Notification::make()
                    ->danger()
                    ->title('Error!')
                    ->body('This password reset token is invalid.')
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
            Action::make('resetPassword')
                ->label('Reset password')
                ->submit('resetPassword'),
        ];
    }
}