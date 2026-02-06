<?php

namespace App\Filament\Admin\Resources\OrderDetails;

use App\Filament\Admin\Resources\OrderDetails\Pages\CreateOrderDetail;
use App\Filament\Admin\Resources\OrderDetails\Pages\EditOrderDetail;
use App\Filament\Admin\Resources\OrderDetails\Pages\ListOrderDetails;
use App\Filament\Admin\Resources\OrderDetails\Schemas\OrderDetailForm;
use App\Filament\Admin\Resources\OrderDetails\Tables\OrderDetailsTable;
use App\Models\OrderDetail;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class OrderDetailResource extends Resource
{
    protected static ?string $model = OrderDetail::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'orderdetail';

    public static function form(Schema $schema): Schema
    {
        return OrderDetailForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return OrderDetailsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListOrderDetails::route('/'),
            'create' => CreateOrderDetail::route('/create'),
            'edit' => EditOrderDetail::route('/{record}/edit'),
        ];
    }
}
