<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;

class AdminVerifyEmail extends Notification
{
    use Queueable;

    /**
     * The callback that should be used to create the verify email URL.
     *
     * @var \Closure|null
     */
    public static $createUrlUsing;

    /**
     * The callback that should be used to build the mail message.
     *
     * @var \Closure|null
     */
    public static $toMailUsing;

    /**
     * Get the notification's delivery channels.
     *
     * @param  mixed  $notifiable
     * @return array
     */
    public function via($notifiable)
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param  mixed  $notifiable
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    public function toMail($notifiable)
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        if (static::$toMailUsing) {
            return call_user_func(static::$toMailUsing, $notifiable, $verificationUrl);
        }

        return $this->buildMailMessage($verificationUrl);
    }

    /**
     * Get the verify email notification mail message for the given URL.
     *
     * @param  string  $url
     * @return \Illuminate\Notifications\Messages\MailMessage
     */
    protected function buildMailMessage($url)
    {
        return (new MailMessage)
            ->subject('Verifikasi Email Administrator - Warung Edin')
            ->greeting('Selamat datang, Administrator!')
            ->line('Akun administrator Anda telah dibuat untuk sistem Warung Edin. Untuk mengaktifkan akun dan mengakses panel admin, silakan verifikasi alamat email Anda.')
            ->line('Klik tombol di bawah ini untuk memverifikasi email administrator:')
            ->action('Verifikasi Email Admin', $url)
            ->line('Setelah verifikasi, Anda dapat mengakses panel admin dengan full privileges.')
            ->line('Jika Anda tidak mendaftar sebagai admin Warung Edin, silakan hubungi tim IT.')
            ->line('Link verifikasi ini akan kedaluwarsa dalam 60 menit.')
            ->salutation('Hormat kami,')
            ->salutation('Tim IT Warung Edin');
    }

    /**
     * Get the verification URL for the given notifiable.
     *
     * @param  mixed  $notifiable
     * @return string
     */
    protected function verificationUrl($notifiable)
    {
        if (static::$createUrlUsing) {
            return call_user_func(static::$createUrlUsing, $notifiable);
        }

        return URL::temporarySignedRoute(
            'admin.verification.verify',
            Carbon::now()->addMinutes(Config::get('auth.verification.expire', 60)),
            [
                'id' => $notifiable->getKey(),
                'hash' => sha1($notifiable->getEmailForVerification()),
            ]
        );
    }

    /**
     * Set a callback that should be used when creating the email verification URL.
     *
     * @param  \Closure  $callback
     * @return void
     */
    public static function createUrlUsing($callback)
    {
        static::$createUrlUsing = $callback;
    }

    /**
     * Set a callback that should be used when building the notification mail message.
     *
     * @param  \Closure  $callback
     * @return void
     */
    public static function toMailUsing($callback)
    {
        static::$toMailUsing = $callback;
    }
}