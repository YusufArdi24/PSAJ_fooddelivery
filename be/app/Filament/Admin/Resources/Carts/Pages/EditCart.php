<?php

namespace App\Filament\Admin\Resources\Carts\Pages;

use App\Filament\Admin\Resources\Carts\CartResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCart extends EditRecord
{
    protected static string $resource = CartResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
