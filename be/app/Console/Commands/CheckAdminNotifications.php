<?php

namespace App\Console\Commands;

use App\Models\AdminNotification;
use Illuminate\Console\Command;

class CheckAdminNotifications extends Command
{
    protected $signature = 'check:notifications';
    protected $description = 'Check admin notifications in database';

    public function handle()
    {
        $this->info('=== Admin Notifications ===');
        $this->newLine();

        $count = AdminNotification::count();
        $this->info("Total notifications: {$count}");
        $this->newLine();

        if ($count > 0) {
            $this->info('Recent 5 notifications:');
            $notifications = AdminNotification::latest()->limit(5)->get();
            
            foreach ($notifications as $notif) {
                $this->line("ID: {$notif->id}");
                $this->line("Type: {$notif->type}");
                $this->line("Title: {$notif->title}");
                $this->line("Body: {$notif->body}");
                $this->line("Read: " . ($notif->read_at ? 'Yes' : 'No'));
                $this->line("Created: {$notif->created_at}");
                $this->newLine();
            }
        } else {
            $this->warn('No notifications found!');
            $this->info('Try creating a new order from customer app.');
        }

        return 0;
    }
}
