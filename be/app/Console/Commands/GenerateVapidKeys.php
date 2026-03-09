<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Minishlink\WebPush\VAPID;

class GenerateVapidKeys extends Command
{
    protected $signature = 'vapid:generate';
    protected $description = 'Generate VAPID keys for Web Push';

    public function handle()
    {
        $this->info('Generating VAPID keys...');
        $this->newLine();

        try {
            $keys = VAPID::createVapidKeys();

            $this->info('✅ VAPID keys generated successfully!');
            $this->newLine();
            
            $this->info('Add these to your .env file:');
            $this->newLine();
            
            $this->line('VAPID_PUBLIC_KEY=' . $keys['publicKey']);
            $this->line('VAPID_PRIVATE_KEY=' . $keys['privateKey']);
            $this->line('VAPID_SUBJECT=mailto:admin@warungedin.com');
            
            $this->newLine();
            $this->warn('⚠️  After updating .env, run: php artisan config:clear');
            $this->warn('⚠️  All existing admin subscriptions need to re-subscribe!');

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to generate VAPID keys: ' . $e->getMessage());
            return 1;
        }
    }
}
