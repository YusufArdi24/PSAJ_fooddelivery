<?php

namespace App\Mail\Transports;

use Resend;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\MessageConverter;

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
        $symfonMessage = $message->getOriginalMessage();
        $from = $symfonMessage->getFrom();
        
        $fromEmail = null;
        foreach ($from as $address) {
            $fromEmail = $address->getAddress();
            break;
        }

        if (!$fromEmail) {
            throw new \Exception('No from address specified');
        }

        $to = array_keys($symfonMessage->getTo());
        
        if (empty($to)) {
            throw new \Exception('No to address specified');
        }

        $html = $symfonMessage->getHtmlBody();
        $text = $symfonMessage->getTextBody();

        try {
            Resend::client($this->key)->emails->send([
                'from' => $fromEmail,
                'to' => $to[0],
                'subject' => $symfonMessage->getSubject(),
                'html' => $html ?? '',
                'text' => $text ?? '',
            ]);
        } catch (\Exception $e) {
            throw new \Exception('Failed to send email via Resend: ' . $e->getMessage());
        }
    }

    public function __toString(): string
    {
        return 'resend';
    }
}
