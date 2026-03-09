<?php

namespace App\Filament\Admin\Resources\Orders\Pages;

use App\Filament\Admin\Resources\Orders\OrderResource;
use Filament\Actions\CreateAction;
use Filament\Actions\Action;
use Filament\Resources\Pages\ListRecords;

class ListOrders extends ListRecords
{
    protected static string $resource = OrderResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
            Action::make('export_pdf')
                ->label('Export Laporan PDF')
                ->icon('heroicon-o-document-arrow-down')
                ->color('success')
                ->form([
                    \Filament\Forms\Components\Select::make('period')
                        ->label('Pilih Periode')
                        ->options([
                            'today' => 'Hari Ini',
                            'this_month' => 'Bulan Ini',
                            'this_year' => 'Tahun Ini',
                            'all' => 'Semua Waktu',
                        ])
                        ->default('this_month')
                        ->required()
                        ->native(false),
                ])
                ->action(function (array $data) {
                    return redirect()->route('admin.reports.orders-summary', [
                        'period' => $data['period'], 
                        'download' => 1
                    ]);
                })
                ->modalSubmitActionLabel('Export PDF'),
        ];
    }
}

