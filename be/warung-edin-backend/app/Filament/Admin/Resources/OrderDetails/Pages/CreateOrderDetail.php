<?php

namespace App\Filament\Admin\Resources\OrderDetails\Pages;

use App\Filament\Admin\Resources\OrderDetails\OrderDetailResource;
use Filament\Resources\Pages\CreateRecord;

class CreateOrderDetail extends CreateRecord
{
    protected static string $resource = OrderDetailResource::class;
}
