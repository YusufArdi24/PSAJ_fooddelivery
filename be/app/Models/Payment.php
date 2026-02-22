<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $primaryKey = 'PaymentID';
    
    protected $fillable = [
        'OrderID',
        'payment_method',
        'payment_status',
        'payment_reference',
        'payment_details',
        'paid_at',
        'amount',
        'notes',
        'snap_token',
        'midtrans_order_id',
        'redirect_url',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'paid_at' => 'datetime',
        'payment_details' => 'array',
        'amount' => 'decimal:2',
    ];

    // Payment method constants
    const METHOD_CASH = 'cash';
    const METHOD_COD = 'cod';
    const METHOD_TRANSFER = 'transfer';
    const METHOD_GOPAY = 'gopay';
    const METHOD_DANA = 'dana';
    const METHOD_OVO = 'ovo';
    const METHOD_LINKAJA = 'linkaja';
    const METHOD_SHOPEEPAY = 'shopeepay';
    const METHOD_QRIS = 'qris';
    const METHOD_BCA = 'bca';
    const METHOD_MANDIRI = 'mandiri';
    const METHOD_BNI = 'bni';
    const METHOD_BRI = 'bri';

    // Payment status constants
    const STATUS_PENDING         = 'pending';
    const STATUS_WAITING_PAYMENT = 'waiting_payment';
    const STATUS_PAID            = 'paid';
    const STATUS_FAILED          = 'failed';
    const STATUS_CANCELLED       = 'cancelled';
    const STATUS_EXPIRED         = 'expired';
    const STATUS_REFUNDED        = 'refunded';

    // Relationships
    public function order()
    {
        return $this->belongsTo(Order::class, 'OrderID', 'OrderID');
    }

    // Status badge color for Filament
    public function getStatusColor(): string
    {
        return match($this->payment_status) {
            'pending'         => 'warning',
            'waiting_payment' => 'info',
            'paid'            => 'success',
            'failed'          => 'danger',
            'cancelled'       => 'danger',
            'expired'         => 'gray',
            'refunded'        => 'info',
            default           => 'secondary',
        };
    }

    // Method label
    public function getMethodLabel(): string
    {
        return match($this->payment_method) {
            'cod'        => 'Cash on Delivery',
            'cash'       => 'Tunai',
            'transfer'   => 'Transfer Bank',
            'gopay'      => 'GoPay',
            'shopeepay'  => 'ShopeePay',
            'dana'       => 'DANA',
            'ovo'        => 'OVO',
            'linkaja'    => 'LinkAja',
            'qris'       => 'QRIS',
            'bca'        => 'Virtual Account BCA',
            'bni'        => 'Virtual Account BNI',
            'bri'        => 'Virtual Account BRI',
            'mandiri'    => 'Mandiri Bill',
            'credit_card'=> 'Kartu Kredit',
            default      => ucfirst($this->payment_method),
        };
    }

    // Check if payment requires Midtrans Snap
    public function requiresMidtrans(): bool
    {
        return !in_array($this->payment_method, ['cash', 'cod']);
    }
}
