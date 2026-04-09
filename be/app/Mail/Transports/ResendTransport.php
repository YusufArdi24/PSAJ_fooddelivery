<?php

namespace App\Mail\Transports;

use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ResendTransport extends AbstractTransport
{
    protected $key;

    public function __construct($key)
    {
        $this->key = $key;
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        // Check if API key is configured
        if (empty($this->key)) {
            throw new \Exception('RESEND_API_KEY environment variable is not set. Configure it in Railway environment variables.');
        }

        $symfonMessage = $message->getOriginalMessage();
        
        // Convert to Email object for easier access
        $email = MessageConverter::toEmail($symfonMessage);
        
        // Get from address
        $fromAddresses = $email->getFrom();
        $fromEmail = null;
        
        if (!empty($fromAddresses)) {
            $fromEmail = $fromAddresses[0]->getAddress();
        }

        if (!$fromEmail) {
            throw new \Exception('No from address specified');
        }

        // Get to addresses
        $toAddresses = $email->getTo();
        if (empty($toAddresses)) {
            throw new \Exception('No to address specified');
        }

        $to = $toAddresses[0]->getAddress();
        $subject = $email->getSubject();
        
        // Get HTML and text bodies
        $html = null;
        $text = null;

        if ($email->getHtmlBody()) {
            $html = $email->getHtmlBody();
        } 
        if ($email->getTextBody()) {
            $text = $email->getTextBody();
        }

        try {
            $payload = [
                'from' => $fromEmail,
                'to' => $to,
                'subject' => $subject,
            ];

            if ($html) {
                $payload['html'] = $html;
            }
            
            if ($text) {
                $payload['text'] = $text;
            }

            // Call Resend API directly via HTTP
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->key}",
                'Content-Type' => 'application/json',
            ])->post('https://api.resend.com/emails', $payload);

            if (!$response->successful()) {
                $error = $response->json('message') ?? $response->body();
                throw new \Exception("Resend API error: {$error}");
            }

            Log::info('Email sent via Resend', [
                'to' => $to,
                'from' => $fromEmail,
                'subject' => $subject,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send email via Resend', [
                'error' => $e->getMessage(),
                'to' => $to ?? 'unknown',
                'from' => $fromEmail ?? 'unknown',
                'trace' => $e->getTraceAsString(),
            ]);
            throw new \Exception('Failed to send email via Resend: ' . $e->getMessage());
        }
    }

    public function __toString(): string
    {
        return 'resend';
    }
}
