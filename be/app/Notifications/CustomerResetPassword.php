<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class CustomerResetPassword extends Notification
{
    use Queueable;

    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $url = $frontendUrl . '/reset-password?token=' . $this->token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

        return (new MailMessage)
            ->subject('Reset Password - Warung Edin')
            ->greeting('Halo!')
            ->line('Kami menerima permintaan untuk mereset password akun Warung Edin Anda.')
            ->action('Reset Password', $url)
            ->line('Link ini akan kedaluarsa dalam 60 menit.')
            ->line('Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.')
            ->salutation('Salam hangat, Tim Warung Edin');
    }
}
