<?php

namespace App\Console\Commands;

use App\Models\AdminNotification;
use Illuminate\Console\Command;

class ClearAdminNotifications extends Command
{
    protected $signature = 'clear:notifications {--all : Clear all notifications including read ones}';
    protected $description = 'Clear admin notifications';

    public function handle()
    {
        if ($this->option('all')) {
            $count = AdminNotification::count();
            AdminNotification::truncate();
            $this->info("✅ Deleted all {$count} notifications");
        } else {
            $count = AdminNotification::whereNull('read_at')->count();
            AdminNotification::whereNull('read_at')->delete();
            $this->info("✅ Deleted {$count} unread notifications");
        }

        return 0;
    }
}
