<?php

namespace App\Livewire\Admin;

use App\Models\AdminNotification;
use Livewire\Component;
use Illuminate\Support\Facades\Auth;

class NotificationBell extends Component
{
    public int $unreadCount = 0;
    public $notifications = [];
    public bool $showDropdown = false;

    protected $listeners = ['notificationRead' => 'loadNotifications'];

    public function mount()
    {
        $this->loadNotifications();
    }

    public function loadNotifications()
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return;
        }

        // Get recent unread notifications
        $this->notifications = AdminNotification::forAdmin($admin->AdminID)
            ->unread()
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'title' => $notification->title,
                    'body' => $notification->body,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'created_at' => $notification->created_at->diffForHumans(),
                ];
            })
            ->toArray();

        // Get unread count
        $this->unreadCount = AdminNotification::forAdmin($admin->AdminID)
            ->unread()
            ->count();
    }

    public function toggleDropdown()
    {
        $this->showDropdown = !$this->showDropdown;
        
        if ($this->showDropdown) {
            $this->loadNotifications();
        }
    }

    public function markAsRead($notificationId)
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return;
        }

        $notification = AdminNotification::forAdmin($admin->AdminID)
            ->where('id', $notificationId)
            ->first();

        if ($notification) {
            $notification->markAsRead();
            
            // Redirect if it's an order notification
            if ($notification->type === 'new_order' && isset($notification->data['order_id'])) {
                $this->showDropdown = false;
                $this->redirect('/admin/orders/' . $notification->data['order_id'] . '/edit');
                return;
            }
        }

        $this->loadNotifications();
    }

    public function markAllAsRead()
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return;
        }

        AdminNotification::forAdmin($admin->AdminID)
            ->unread()
            ->update(['read_at' => now()]);

        $this->loadNotifications();
    }

    public function render()
    {
        return view('livewire.admin.notification-bell');
    }

    // Wire:poll to check for new notifications every 10 seconds
    public function getListeners()
    {
        return [
            'echo:admin-notifications,AdminNotificationEvent' => 'loadNotifications',
        ];
    }
}
