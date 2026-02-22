<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpVerificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $otp,
        public readonly string $recipientName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Kode Verifikasi Warung Edin');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.otp-verification');
    }
}
