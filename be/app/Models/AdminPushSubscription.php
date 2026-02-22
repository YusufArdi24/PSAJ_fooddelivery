<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminPushSubscription extends Model
{
    protected $table = 'admin_push_subscriptions';

    protected $fillable = [
        'AdminID',
        'endpoint',
        'public_key',
        'auth_token',
    ];

    public function admin()
    {
        return $this->belongsTo(Admin::class, 'AdminID', 'AdminID');
    }
}
