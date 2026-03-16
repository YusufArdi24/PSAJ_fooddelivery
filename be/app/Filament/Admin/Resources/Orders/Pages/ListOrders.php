<?php

namespace App\Filament\Admin\Resources\Orders\Pages;

use App\Filament\Admin\Resources\Orders\OrderResource;
use Filament\Actions\CreateAction;
use Filament\Actions\Action;
use Filament\Resources\Pages\ListRecords;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Select;
use Carbon\Carbon;

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
                    Select::make('filter_type')
                        ->label('Tipe Filter')
                        ->options([
                            'preset' => 'Preset (Hari Ini / Bulan Ini / Tahun Ini)',
                            'date_range' => 'Rentang Tanggal Custom',
                            'month_range' => 'Rentang Bulan',
                            'year_range' => 'Rentang Tahun',
                        ])
                        ->default('preset')
                        ->required()
                        ->native(false)
                        ->reactive()
                        ->afterStateUpdated(fn () => true),
                    
                    // Preset Period
                    Select::make('period')
                        ->label('Pilih Periode')
                        ->options([
                            'today' => 'Hari Ini',
                            'this_month' => 'Bulan Ini',
                            'this_year' => 'Tahun Ini',
                            'all' => 'Semua Waktu',
                        ])
                        ->default('this_month')
                        ->required()
                        ->native(false)
                        ->visible(fn ($get) => $get('filter_type') === 'preset'),
                    
                    // Date Range
                    DatePicker::make('start_date')
                        ->label('Tanggal Mulai')
                        ->displayFormat('d/m/Y')
                        ->required()
                        ->visible(fn ($get) => $get('filter_type') === 'date_range'),
                    
                    DatePicker::make('end_date')
                        ->label('Tanggal Akhir')
                        ->displayFormat('d/m/Y')
                        ->required()
                        ->minDate(fn ($get) => $get('start_date'))
                        ->visible(fn ($get) => $get('filter_type') === 'date_range'),
                    
                    // Month Range
                    Select::make('start_month')
                        ->label('Bulan Mulai')
                        ->options([
                            '01' => 'Januari',
                            '02' => 'Februari',
                            '03' => 'Maret',
                            '04' => 'April',
                            '05' => 'Mei',
                            '06' => 'Juni',
                            '07' => 'Juli',
                            '08' => 'Agustus',
                            '09' => 'September',
                            '10' => 'Oktober',
                            '11' => 'November',
                            '12' => 'Desember',
                        ])
                        ->required()
                        ->native(false)
                        ->visible(fn ($get) => $get('filter_type') === 'month_range'),
                    
                    Select::make('end_month')
                        ->label('Bulan Akhir')
                        ->options([
                            '01' => 'Januari',
                            '02' => 'Februari',
                            '03' => 'Maret',
                            '04' => 'April',
                            '05' => 'Mei',
                            '06' => 'Juni',
                            '07' => 'Juli',
                            '08' => 'Agustus',
                            '09' => 'September',
                            '10' => 'Oktober',
                            '11' => 'November',
                            '12' => 'Desember',
                        ])
                        ->required()
                        ->native(false)
                        ->visible(fn ($get) => $get('filter_type') === 'month_range'),
                    
                    Select::make('month_year')
                        ->label('Tahun')
                        ->options(function () {
                            $options = [];
                            $currentYear = (int) date('Y');
                            for ($i = $currentYear - 5; $i <= $currentYear; $i++) {
                                $options[(string)$i] = (string)$i;
                            }
                            return $options;
                        })
                        ->default((string) date('Y'))
                        ->required()
                        ->native(false)
                        ->visible(fn ($get) => $get('filter_type') === 'month_range'),
                    
                    // Year Range
                    Select::make('start_year')
                        ->label('Tahun Mulai')
                        ->options(function () {
                            $options = [];
                            $currentYear = (int) date('Y');
                            for ($i = $currentYear - 10; $i <= $currentYear; $i++) {
                                $options[(string)$i] = (string)$i;
                            }
                            return $options;
                        })
                        ->required()
                        ->native(false)
                        ->visible(fn ($get) => $get('filter_type') === 'year_range'),
                    
                    Select::make('end_year')
                        ->label('Tahun Akhir')
                        ->options(function () {
                            $options = [];
                            $currentYear = (int) date('Y');
                            for ($i = $currentYear - 10; $i <= $currentYear; $i++) {
                                $options[(string)$i] = (string)$i;
                            }
                            return $options;
                        })
                        ->required()
                        ->native(false)
                        ->visible(fn ($get) => $get('filter_type') === 'year_range'),
                ])
                ->action(function (array $data) {
                    $params = ['download' => 1];
                    
                    if ($data['filter_type'] === 'preset') {
                        $params['period'] = $data['period'];
                    } elseif ($data['filter_type'] === 'date_range') {
                        $params['filter_type'] = 'date_range';
                        $params['start_date'] = $data['start_date'];
                        $params['end_date'] = $data['end_date'];
                    } elseif ($data['filter_type'] === 'month_range') {
                        $params['filter_type'] = 'month_range';
                        $params['start_month'] = $data['start_month'];
                        $params['end_month'] = $data['end_month'];
                        $params['month_year'] = $data['month_year'];
                    } elseif ($data['filter_type'] === 'year_range') {
                        $params['filter_type'] = 'year_range';
                        $params['start_year'] = $data['start_year'];
                        $params['end_year'] = $data['end_year'];
                    }
                    
                    return redirect()->route('admin.reports.orders-summary', $params);
                })
                ->modalSubmitActionLabel('Export PDF'),
        ];
    }
}

