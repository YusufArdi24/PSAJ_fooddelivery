<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestEmailSending extends Command
{
    protected $signature = 'test:email {email}';
    protected $description = 'Test email sending to verify SMTP configuration';

    public function handle()
    {
        $email = $this->argument('email');
        
        $this->info("Testing email send to: {$email}");
        $this->info("MAIL_HOST: " . config('mail.mailers.smtp.host'));
        $this->info("MAIL_PORT: " . config('mail.mailers.smtp.port'));
        $this->info("MAIL_SCHEME: " . config('mail.mailers.smtp.scheme'));
        $this->info("MAIL_TIMEOUT: " . config('mail.mailers.smtp.timeout'));
        $this->info("QUEUE_CONNECTION: " . config('queue.default'));
        
        try {
            Mail::raw('This is a test email from Warung Edin to verify SMTP configuration works correctly.', function ($message) use ($email) {
                $message->to($email)
                        ->subject('Test Email from Warung Edin');
            });
            
            $this->info("✅ Email sent successfully!");
            Log::info("Test email sent successfully to {$email}");
            return 0;
        } catch (\Exception $e) {
            $this->error("❌ Email send failed!");
            $this->error("Error: " . $e->getMessage());
            $this->error("Code: " . $e->getCode());
            Log::error("Test email failed", [
                'email' => $email,
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
            ]);
            return 1;
        }
    }
}
