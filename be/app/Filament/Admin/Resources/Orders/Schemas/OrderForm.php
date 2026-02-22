<?php

namespace App\Filament\Admin\Resources\Orders\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Infolists\Components\TextEntry;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use App\Models\Customer;

class OrderForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Informasi Customer')
                    ->schema([
                        Select::make('CustomerID')
                            ->label('Customer')
                            ->options(Customer::pluck('name', 'CustomerID'))
                            ->required()
                            ->searchable()
                            ->disabled(fn ($record) => $record !== null)
                            ->reactive()
                            ->afterStateUpdated(function ($state, callable $set, callable $get) {
                                if ($state) {
                                    $customer = Customer::find($state);
                                    if ($customer) {
                                        $set('customer_address_display', $customer->address);
                                        $set('customer_phone_display', $customer->phone);
                                    }
                                }
                            }),
                        TextInput::make('customer_address_display')
                            ->label('Alamat Pengantaran')
                            ->disabled()
                            ->dehydrated(false)
                            ->columnSpanFull(),
                        TextInput::make('customer_phone_display')
                            ->label('No. Telepon Customer')
                            ->disabled()
                            ->dehydrated(false),
                    ])
                    ->columns(['default' => 1, 'sm' => 2]),
                
                Section::make('Detail Order')
                    ->schema([
                        DateTimePicker::make('order_date')
                            ->label('Tanggal Order')
                            ->required()
                            ->disabled(fn ($record) => $record !== null)
                            ->default(now()),
                        TextEntry::make('total_price_display')
                            ->label('Total Harga (Setelah Diskon)')
                            ->state(function ($record) {
                                if (!$record) return '-';
                                $record->loadMissing(['orderDetails.menu.activePromo']);
                                $total = 0;
                                foreach ($record->orderDetails as $detail) {
                                    $originalPrice = $detail->original_price ?? ($detail->menu ? $detail->menu->price : $detail->price);
                                    $discountPerItem = (float) $detail->discount_per_item;
                                    // old orders: original_price was null, discount not stored → compute from active promo
                                    if ($detail->original_price === null) {
                                        $promo = $detail->menu?->activePromo;
                                        $discountPerItem = $promo ? $promo->calculateDiscount((float) $originalPrice) : 0;
                                    }
                                    $discountedPrice = max(0, (float) $originalPrice - $discountPerItem);
                                    $total += $discountedPrice * $detail->quantity;
                                }
                                return new \Illuminate\Support\HtmlString('<span style="font-weight:bold;font-size:18px;color:#16a34a;">Rp ' . number_format($total, 0, ',', '.') . '</span>');
                            }),
                        Select::make('status')
                            ->label('Status Order')
                            ->options([
                                'pending' => 'Pending',
                                'confirmed' => 'Confirmed',
                                'preparing' => 'Preparing',
                                'ready' => 'Ready',
                                'delivered' => 'Delivered',
                                'cancelled' => 'Cancelled',
                            ])
                            ->default('pending')
                            ->required(),
                        Textarea::make('notes')
                            ->label('Customer Notes')
                            ->placeholder('Special requests from customer...')
                            ->rows(4)
                            ->disabled(fn ($record) => $record !== null)
                            ->columnSpanFull(),
                    ])
                    ->columns(['default' => 1, 'sm' => 2]),
                    
                Section::make('Item Order')
                    ->schema([
                        TextEntry::make('order_items')
                            ->label('')
                            ->state(function ($record) {
                                if (!$record) {
                                    return 'Belum ada item order';
                                }
                                
                                // Force load the relationship
                                $record->load(['orderDetails.menu.activePromo']);
                                
                                if ($record->orderDetails->isEmpty()) {
                                    return 'Tidak ada item dalam order ini';
                                }
                                
                                $grandTotal = 0;
                                $grandOriginal = 0;
                                $grandDiscount = 0;
                                $hasDiscount = false;
                                
                                $html = '<div class="overflow-x-auto">';
                                $html .= '<table style="width: 100%; border-collapse: collapse; border: 2px solid #e5e7eb;">';
                                $html .= '<thead>';
                                $html .= '<tr style="background: linear-gradient(to right, #3b82f6, #2563eb); color: white;">';
                                $html .= '<th style="width: 35%; text-align: left; padding: 16px; font-weight: bold; border-right: 1px solid rgba(255,255,255,0.2);">Menu</th>';
                                $html .= '<th style="width: 15%; text-align: left; padding: 16px; font-weight: bold; border-right: 1px solid rgba(255,255,255,0.2);">Varian</th>';
                                $html .= '<th style="width: 10%; text-align: center; padding: 16px; font-weight: bold; border-right: 1px solid rgba(255,255,255,0.2);">Jumlah</th>';
                                $html .= '<th style="width: 20%; text-align: right; padding: 16px; font-weight: bold; border-right: 1px solid rgba(255,255,255,0.2);">Harga Normal</th>';
                                $html .= '<th style="width: 10%; text-align: right; padding: 16px; font-weight: bold; border-right: 1px solid rgba(255,255,255,0.2);">Diskon</th>';
                                $html .= '<th style="width: 10%; text-align: right; padding: 16px; font-weight: bold;">Total</th>';
                                $html .= '</tr>';
                                $html .= '</thead>';
                                $html .= '<tbody>';
                                
                                foreach ($record->orderDetails as $detail) {
                                    $originalPrice = $detail->original_price ?? ($detail->menu ? $detail->menu->price : $detail->price);
                                    $discountPerItem = (float) $detail->discount_per_item;
                                    // old orders: original_price was null, discount not stored → compute from active promo
                                    if ($detail->original_price === null) {
                                        $promo = $detail->menu?->activePromo;
                                        $discountPerItem = $promo ? $promo->calculateDiscount((float) $originalPrice) : 0;
                                    }
                                    $discountedPrice = max(0, (float) $originalPrice - $discountPerItem);
                                    $subtotalOriginal = $originalPrice * $detail->quantity;
                                    $subtotalDiscount = $discountPerItem * $detail->quantity;
                                    $subtotal = $discountedPrice * $detail->quantity;

                                    $grandOriginal += $subtotalOriginal;
                                    $grandDiscount += $subtotalDiscount;
                                    $grandTotal += $subtotal;

                                    if ($discountPerItem > 0) $hasDiscount = true;

                                    $html .= '<tr style="border-bottom: 1px solid #e5e7eb; background-color: white;">';
                                    $html .= '<td style="padding: 16px; font-weight: 500; color: #111827; border-right: 1px solid #e5e7eb;">' . htmlspecialchars($detail->menu_name ?? ($detail->menu?->name) ?? 'Menu tidak ditemukan') . '</td>';
                                    // Varian
                                    $variantLabel = $detail->selected_variant
                                        ? '<span style="display:inline-block;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:9999px;padding:2px 10px;font-size:12px;font-weight:600;">' . htmlspecialchars($detail->selected_variant) . '</span>'
                                        : '<span style="color:#9ca3af;font-size:12px;">-</span>';
                                    $html .= '<td style="padding: 16px; border-right: 1px solid #e5e7eb;">' . $variantLabel . '</td>';
                                    $html .= '<td style="padding: 16px; text-align: center; font-weight: 600; color: #374151; border-right: 1px solid #e5e7eb;">' . $detail->quantity . '</td>';

                                    // Harga Normal
                                    if ($discountPerItem > 0) {
                                        $html .= '<td style="padding: 16px; text-align: right; color: #6b7280; text-decoration: line-through; border-right: 1px solid #e5e7eb;">Rp ' . number_format($subtotalOriginal, 0, ',', '.') . '</td>';
                                        $html .= '<td style="padding: 16px; text-align: right; color: #dc2626; font-weight: 600; border-right: 1px solid #e5e7eb;">- Rp ' . number_format($subtotalDiscount, 0, ',', '.') . '</td>';
                                        $html .= '<td style="padding: 16px; text-align: right; font-weight: bold; color: #16a34a;">Rp ' . number_format($subtotal, 0, ',', '.') . '</td>';
                                    } else {
                                        $html .= '<td style="padding: 16px; text-align: right; color: #374151; border-right: 1px solid #e5e7eb;">Rp ' . number_format($subtotalOriginal, 0, ',', '.') . '</td>';
                                        $html .= '<td style="padding: 16px; text-align: right; color: #9ca3af; border-right: 1px solid #e5e7eb;">-</td>';
                                        $html .= '<td style="padding: 16px; text-align: right; font-weight: bold; color: #111827;">Rp ' . number_format($subtotal, 0, ',', '.') . '</td>';
                                    }
                                    $html .= '</tr>';
                                }
                                
                                    // Grand total summary rows
                                    if ($hasDiscount) {
                                        $html .= '<tr style="background-color: #fafafa; border-top: 2px solid #e5e7eb;">';
                                        $html .= '<td colspan="5" style="padding: 12px 16px; text-align: right; color: #374151; font-size: 14px;">Subtotal (Harga Normal):</td>';
                                        $html .= '<td style="padding: 12px 16px; text-align: right; color: #374151; text-decoration: line-through;">Rp ' . number_format($grandOriginal, 0, ',', '.') . '</td>';
                                        $html .= '</tr>';
                                        $html .= '<tr style="background-color: #fff5f5;">';
                                        $html .= '<td colspan="5" style="padding: 12px 16px; text-align: right; color: #dc2626; font-size: 14px;">Total Diskon:</td>';
                                        $html .= '<td style="padding: 12px 16px; text-align: right; color: #dc2626; font-weight: bold;">- Rp ' . number_format($grandDiscount, 0, ',', '.') . '</td>';
                                        $html .= '</tr>';
                                    }

                                // Grand total
                                $html .= '<tr style="background: linear-gradient(to right, #f0fdf4, #dcfce7); border-top: 4px solid #22c55e;">';
                                $html .= '<td colspan="5" style="padding: 16px; text-align: right; font-weight: bold; color: #111827; font-size: 18px;">TOTAL KESELURUHAN:</td>';
                                $html .= '<td style="padding: 16px; text-align: right; font-weight: bold; color: #16a34a; font-size: 24px;">Rp ' . number_format($grandTotal, 0, ',', '.') . '</td>';
                                $html .= '</tr>';
                                
                                $html .= '</tbody>';
                                $html .= '</table>';
                                $html .= '</div>';
                                
                                return new \Illuminate\Support\HtmlString($html);
                            })
                            ->columnSpanFull(),
                    ])
                    ->collapsible()
                    ->visible(fn ($record) => $record !== null),
                    
                Section::make('Informasi Pembayaran')
                    ->schema([
                        TextEntry::make('payment_info')
                            ->label('')
                            ->state(function ($record) {
                                if (!$record) {
                                    return 'Belum ada informasi pembayaran';
                                }
                                
                                // Load all relationships
                                $record->load(['customer', 'orderDetails.menu.activePromo', 'payment']);
                                
                                $payment = $record->payment;
                                $customer = $record->customer;
                                $admin = filament()->auth()->user();
                                
                                // Complete receipt layout
                                $html = '<div class="bg-white border-4 border-gray-400 rounded-xl p-8 max-w-2xl mx-auto shadow-lg" style="font-family: \'Courier New\', monospace;">';
                                
                                // Header - Warung Name
                                $html .= '<div class="text-center border-b-4 border-double border-gray-800 pb-4 mb-6">';
                                $html .= '<div class="text-3xl font-black text-gray-900 tracking-wider">WARUNG EDIN</div>';
                                $html .= '<div class="text-sm text-gray-600 mt-2">Jl. Contoh No. 123, Jakarta</div>';
                                $html .= '<div class="text-sm text-gray-600">Telp: 021-12345678</div>';
                                $html .= '</div>';
                                
                                // Order Info
                                $html .= '<div class="mb-4 pb-4 border-b-2 border-dashed border-gray-400">';
                                $html .= '<div class="grid grid-cols-2 gap-2 text-sm">';
                                $html .= '<div><span class="font-bold">No. Order:</span></div>';
                                $html .= '<div class="text-right">#' . str_pad($record->OrderID, 5, '0', STR_PAD_LEFT) . '</div>';
                                $html .= '<div><span class="font-bold">Tanggal:</span></div>';
                                $html .= '<div class="text-right">' . $record->order_date->format('d/m/Y H:i') . ' WIB</div>';
                                $html .= '<div><span class="font-bold">Kasir/Admin:</span></div>';
                                $html .= '<div class="text-right">' . htmlspecialchars($admin->name) . '</div>';
                                $html .= '</div>';
                                $html .= '</div>';
                                
                                // Customer Info
                                $html .= '<div class="mb-4 pb-4 border-b-2 border-dashed border-gray-400">';
                                $html .= '<div class="text-sm font-bold text-gray-800 mb-2">CUSTOMER:</div>';
                                $html .= '<div class="text-sm">';
                                $html .= '<div class="mb-1"><span class="font-semibold">Nama:</span> ' . htmlspecialchars($customer->name) . '</div>';
                                $html .= '<div class="mb-1"><span class="font-semibold">Telepon:</span> ' . htmlspecialchars($customer->phone) . '</div>';
                                $html .= '<div><span class="font-semibold">Alamat Pengantaran:</span></div>';
                                $html .= '<div class="ml-4 text-gray-700 whitespace-pre-wrap">' . htmlspecialchars($customer->address) . '</div>';
                                $html .= '</div>';
                                $html .= '</div>';
                                
                                // Order Items
                                $html .= '<div class="mb-4 pb-4 border-b-2 border-dashed border-gray-400">';
                                $html .= '<div class="text-sm font-bold text-gray-800 mb-3">PESANAN:</div>';
                                $html .= '<table class="w-full text-sm">';
                                
                                $totalAmount = 0;
                                $totalOriginal = 0;
                                $totalDiscountAmt = 0;
                                foreach ($record->orderDetails as $detail) {
                                    $origPrice = $detail->original_price ?? ($detail->menu ? $detail->menu->price : $detail->price);
                                    $discPer = (float) $detail->discount_per_item;
                                    // old orders: original_price was null, discount not stored → compute from active promo
                                    if ($detail->original_price === null) {
                                        $promo = $detail->menu?->activePromo;
                                        $discPer = $promo ? $promo->calculateDiscount((float) $origPrice) : 0;
                                    }
                                    $discPrice = max(0, (float) $origPrice - $discPer);
                                    $subtotal = $discPrice * $detail->quantity;
                                    $totalAmount += $subtotal;
                                    $totalOriginal += $origPrice * $detail->quantity;
                                    $totalDiscountAmt += $discPer * $detail->quantity;
                                    
                                    $html .= '<tr class="border-b border-gray-300">';
                                    $html .= '<td class="py-2 align-top" colspan="3">';
                                    $html .= '<div class="font-semibold text-gray-900">' . htmlspecialchars($detail->menu_name ?? ($detail->menu?->name) ?? 'Menu tidak ditemukan') . '</div>';
                                    if ($detail->selected_variant) {
                                        $html .= '<div style="margin-top:4px;"><span style="display:inline-block;background:#fff7ed;color:#c2410c;border:1px solid #fed7aa;border-radius:9999px;padding:1px 8px;font-size:11px;font-weight:600;">' . htmlspecialchars($detail->selected_variant) . '</span></div>';
                                    }
                                    $html .= '</td>';
                                    $html .= '</tr>';
                                    
                                    $html .= '<tr>';
                                    $html .= '<td class="pb-1 pl-4 text-gray-600" style="width: 15%;">' . $detail->quantity . ' x</td>';
                                    if ($discPer > 0) {
                                        $html .= '<td class="pb-1 text-right text-gray-400 line-through" style="width: 40%;">@ Rp ' . number_format($origPrice, 0, ',', '.') . '</td>';
                                        $html .= '<td class="pb-1 text-right text-green-700 font-bold" style="width: 45%;">Rp ' . number_format($subtotal, 0, ',', '.') . '</td>';
                                    } else {
                                        $html .= '<td class="pb-1 text-right text-gray-600" style="width: 40%;">@ Rp ' . number_format($origPrice, 0, ',', '.') . '</td>';
                                        $html .= '<td class="pb-1 text-right font-bold text-gray-900" style="width: 45%;">Rp ' . number_format($subtotal, 0, ',', '.') . '</td>';
                                    }
                                    $html .= '</tr>';
                                    if ($discPer > 0) {
                                        $html .= '<tr>';
                                        $html .= '<td colspan="2" class="pb-3 pl-4 text-xs text-red-500">Diskon: - Rp ' . number_format($discPer * $detail->quantity, 0, ',', '.') . '</td>';
                                        $html .= '<td></td>';
                                        $html .= '</tr>';
                                    }
                                }
                                
                                $html .= '</table>';
                                $html .= '</div>';
                                
                                // Total
                                $html .= '<div class="mb-4 pb-4 border-b-4 border-double border-gray-800">';
                                if ($totalDiscountAmt > 0) {
                                    $html .= '<div class="flex justify-between items-center text-sm text-gray-500 mb-1">';
                                    $html .= '<div>Subtotal (harga normal):</div>';
                                    $html .= '<div class="line-through">Rp ' . number_format($totalOriginal, 0, ',', '.') . '</div>';
                                    $html .= '</div>';
                                    $html .= '<div class="flex justify-between items-center text-sm text-red-600 mb-2">';
                                    $html .= '<div>Total Diskon:</div>';
                                    $html .= '<div class="font-semibold">- Rp ' . number_format($totalDiscountAmt, 0, ',', '.') . '</div>';
                                    $html .= '</div>';
                                }
                                $html .= '<div class="flex justify-between items-center">';
                                $html .= '<div class="text-xl font-bold text-gray-900">TOTAL PEMBAYARAN:</div>';
                                $html .= '<div class="text-2xl font-black text-green-600">Rp ' . number_format($totalAmount, 0, ',', '.') . '</div>';
                                $html .= '</div>';
                                $html .= '</div>';
                                
                                // Payment Method
                                if ($payment) {
                                    $html .= '<div class="mb-4 pb-4 border-b-2 border-dashed border-gray-400">';
                                    $html .= '<div class="flex justify-between text-sm">';
                                    $html .= '<div><span class="font-bold">Metode Pembayaran:</span></div>';
                                    $html .= '<div class="font-bold text-blue-600">' . strtoupper($payment->payment_method) . '</div>';
                                    $html .= '</div>';
                                    
                                    if ($payment->payment_reference) {
                                        $html .= '<div class="flex justify-between text-sm mt-2">';
                                        $html .= '<div><span class="font-semibold">No. Referensi:</span></div>';
                                        $html .= '<div>' . htmlspecialchars($payment->payment_reference) . '</div>';
                                        $html .= '</div>';
                                    }
                                    
                                    if ($payment->paid_at) {
                                        $html .= '<div class="flex justify-between text-sm mt-2">';
                                        $html .= '<div><span class="font-semibold">Dibayar pada:</span></div>';
                                        $html .= '<div>' . $payment->paid_at->format('d/m/Y H:i') . ' WIB</div>';
                                        $html .= '</div>';
                                    }
                                    $html .= '</div>';
                                }
                                
                                // Customer Notes
                                if ($record->notes) {
                                    $html .= '<div class="mb-4 pb-4 border-b-2 border-dashed border-gray-400">';
                                    $html .= '<div class="text-sm font-bold text-gray-800 mb-2">CATATAN CUSTOMER:</div>';
                                    $html .= '<div class="text-sm text-gray-700 bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">';
                                    $html .= nl2br(htmlspecialchars($record->notes));
                                    $html .= '</div>';
                                    $html .= '</div>';
                                }
                                
                                // Footer
                                $html .= '<div class="text-center mt-6">';
                                $html .= '<div class="text-lg font-bold text-gray-800 mb-2">Terima Kasih Atas Pesanan Anda!</div>';
                                $html .= '<div class="text-xs text-gray-500">Struk ini dicetak secara otomatis</div>';
                                $html .= '<div class="text-xs text-gray-500 mt-1">' . now()->format('d/m/Y H:i:s') . ' WIB</div>';
                                $html .= '</div>';
                                
                                $html .= '</div>';
                                
                                return new \Illuminate\Support\HtmlString($html);
                            })
                            ->columnSpanFull(),
                    ])
                    ->collapsible()
                    ->visible(fn ($record) => $record !== null),
            ]);
    }
}
