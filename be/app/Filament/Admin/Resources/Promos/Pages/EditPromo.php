<?php

namespace App\Filament\Admin\Resources\Promos\Pages;

use App\Filament\Admin\Resources\Promos\PromoResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditPromo extends EditRecord
{
    protected static string $resource = PromoResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
