<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Log;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'CustomerID',
        'type',
        'title',
        'message',
        'order_id',
        'menu_id',
        'promo_id',
        'read',
        'read_at',
    ];

    protected $casts = [
        'read' => 'boolean',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Relationships
    public function customer()
    {
        return $this->belongsTo(Customer::class, 'CustomerID', 'CustomerID');
    }

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'OrderID');
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class, 'menu_id', 'MenuID');
    }

    public function promo()
    {
        return $this->belongsTo(Promo::class, 'promo_id', 'PromoID');
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->where('read', false);
    }

    public function scopeForCustomer($query, $customerId)
    {
        return $query->where('CustomerID', $customerId);
    }

    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Helpers
    public function markAsRead()
    {
        $this->update([
            'read' => true,
            'read_at' => now(),
        ]);
    }

    public static function createForCustomer($customerId, $type, $title, $message, $orderId = null, $menuId = null, $promoId = null)
    {
        return self::create([
            'CustomerID' => $customerId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'order_id' => $orderId,
            'menu_id' => $menuId,
            'promo_id' => $promoId,
        ]);
    }

    public static function createForAllCustomers($type, $title, $message, $orderId = null, $menuId = null, $promoId = null)
    {
        $customers = Customer::all();
        
        Log::info('Creating notifications for all customers', [
            'customer_count' => $customers->count(),
            'type' => $type,
            'title' => $title
        ]);
        
        if ($customers->isEmpty()) {
            Log::warning('No customers found to send notifications');
            return;
        }
        
        $notifications = [];

        foreach ($customers as $customer) {
            $notifications[] = [
                'CustomerID' => $customer->CustomerID,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'order_id' => $orderId,
                'menu_id' => $menuId,
                'promo_id' => $promoId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        self::insert($notifications);
        
        Log::info('Notifications created successfully', [
            'notification_count' => count($notifications)
        ]);
    }
}
