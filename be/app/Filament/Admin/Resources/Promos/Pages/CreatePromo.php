<?php

namespace App\Filament\Admin\Resources\Promos\Pages;

use App\Filament\Admin\Resources\Promos\PromoResource;
use Filament\Resources\Pages\CreateRecord;

class CreatePromo extends CreateRecord
{
    protected static string $resource = PromoResource::class;
    
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        // Ensure AdminID is set to current logged-in admin
        if (!isset($data['AdminID']) || empty($data['AdminID'])) {
            $data['AdminID'] = filament()->auth()->user()->AdminID;
        }
        
        return $data;
    }

    protected function getRedirectUrl(): string
    {
        return $this->getResource()::getUrl('index');
    }
}
