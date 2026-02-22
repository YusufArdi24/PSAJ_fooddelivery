<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Menu;
use App\Models\Payment;
use App\Models\Notification;
use App\Services\PushNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function customerOrders(Request $request)
    {
        $paginator = Order::where('CustomerID', $request->user()->CustomerID)
                     ->with(['orderDetails.menu.activePromo', 'payment'])
                     ->orderBy('created_at', 'desc')
                     ->paginate($request->get('per_page', 10));

        // Explicitly map to guarantee consistent key names and compute discounts for old orders
        $mapped = $paginator->getCollection()->map(function ($order) {
            $totalDiscount = 0;

            $details = $order->orderDetails->map(function ($detail) use (&$totalDiscount) {
                $originalPrice = (float) ($detail->original_price ?? ($detail->menu ? $detail->menu->price : $detail->price));
                $discountPerItem = (float) $detail->discount_per_item;

                // Old order: original_price not stored → compute from active promo
                if ($detail->original_price === null) {
                    $promo = $detail->menu?->activePromo;
                    $discountPerItem = $promo ? (float) $promo->calculateDiscount($originalPrice) : 0;
                }

                $discountedPrice = max(0, $originalPrice - $discountPerItem);
                $totalDiscount += $discountPerItem * (int) $detail->quantity;

                return [
                    'OrderDetailID'     => $detail->OrderDetailID,
                    'OrderID'           => $detail->OrderID,
                    'MenuID'            => $detail->MenuID,
                    'quantity'          => (int) $detail->quantity,
                    'price'             => round($discountedPrice, 2),
                    'original_price'    => round($originalPrice, 2),
                    'discount_per_item' => round($discountPerItem, 2),                    'selected_variant'  => $detail->selected_variant,                    'menu'              => [
                        'MenuID'       => $detail->MenuID,
                        'menu_name'    => $detail->menu_name ?? ($detail->menu?->name) ?? 'Menu tidak tersedia',
                        'description'  => $detail->menu?->description ?? '',
                        'price'        => $detail->menu ? (float) $detail->menu->price : (float) $detail->price,
                        'category'     => $detail->menu?->category ?? '',
                        'image'        => $detail->menu?->image_url ?? null,
                        'is_available' => (bool) ($detail->menu?->is_available ?? false),
                    ],
                ];
            });

            // For old orders discount_amount may be 0 — use computed value
            $discountAmount = (float) $order->discount_amount;
            if ($discountAmount == 0 && $totalDiscount > 0) {
                $discountAmount = $totalDiscount;
            }

            return [
                'OrderID'         => $order->OrderID,
                'CustomerID'      => $order->CustomerID,
                'order_date'      => $order->order_date,
                'total_price'     => (float) $order->total_price,
                'discount_amount' => round($discountAmount, 2),
                'status'          => $order->status,
                'notes'           => $order->notes,
                'created_at'      => $order->created_at,
                'updated_at'      => $order->updated_at,
                'order_details'   => $details,
                'payment'         => $order->payment ? [
                    'PaymentID'      => $order->payment->PaymentID,
                    'payment_method' => $order->payment->payment_method,
                    'payment_status' => $order->payment->payment_status,
                    'amount'         => (float) $order->payment->amount,
                ] : null,
            ];
        });

        $paginator->setCollection($mapped);

        return response()->json([
            'success' => true,
            'data'    => $paginator,
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,MenuID',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.selected_variant' => 'nullable|string|max:100',
            'payment_method' => 'required|in:cash,cod,transfer,gopay,dana,ovo,linkaja,shopeepay,qris,bca,mandiri,bni,bri',
            'notes' => 'nullable|string|max:500'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        DB::beginTransaction();
        
        try {
            $totalPrice = 0;
            $orderItems = [];
            
            // Validate items and calculate total
            foreach ($request->items as $item) {
                $menu = Menu::where('MenuID', $item['menu_id'])
                          ->where('is_available', true)
                          ->first();
                          
                if (!$menu) {
                    DB::rollback();
                    return response()->json([
                        'success' => false,
                        'message' => 'Menu item not available: ' . $item['menu_id']
                    ], 422);
                }
                
                $itemTotal = $menu->price * $item['quantity'];
                $totalPrice += $itemTotal;
                
                $orderItems[] = [
                    'menu' => $menu,
                    'quantity' => $item['quantity'],
                    'price' => $menu->price,
                    'subtotal' => $itemTotal,
                    'selected_variant' => $item['selected_variant'] ?? null,
                ];
            }
            
            // Create order
            $order = Order::create([
                'CustomerID' => $request->user()->CustomerID,
                'order_date' => now(),
                'total_price' => $totalPrice,
                'status' => 'pending',
                'notes' => $request->notes
            ]);
            
            // Create order details
            foreach ($orderItems as $item) {
                OrderDetail::create([
                    'OrderID' => $order->OrderID,
                    'MenuID' => $item['menu']->MenuID,
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'selected_variant' => $item['selected_variant'],
                ]);
            }
            
            // Determine payment status based on method
            $paymentStatus = in_array($request->payment_method, ['cash', 'cod']) ? 'pending' : 'waiting_payment';
            
            // Auto-generate payment details from customer data
            $customer = $request->user();
            $paymentDetails = [
                'phone' => $customer->phone,
                'account_name' => $customer->name,
                'customer_email' => $customer->email,
                'customer_address' => $customer->address
            ];
            
            // Create payment record
            Payment::create([
                'OrderID' => $order->OrderID,
                'payment_method' => $request->payment_method,
                'payment_status' => $paymentStatus,
                'payment_details' => $paymentDetails,
                'amount' => $totalPrice,
                'notes' => $request->notes,
            ]);
            
            DB::commit();
            
            $order->load(['orderDetails.menu', 'payment']);

            // Notify all admins via Web Push about the new order
            try {
                $customer = $request->user();
                $menuNames = collect($orderItems)->pluck('menu.name')->take(2)->toArray();
                $menuSummary = implode(', ', $menuNames);
                if (count($orderItems) > 2) {
                    $menuSummary .= ' dan ' . (count($orderItems) - 2) . ' menu lainnya';
                }
                app(\App\Services\PushNotificationService::class)->sendToAllAdmins(
                    '🛒 Pesanan Baru Masuk!',
                    "Pesanan #{$order->OrderID} dari {$customer->name}: {$menuSummary} — Rp " . number_format($totalPrice, 0, ',', '.'),
                    ['type' => 'new_order', 'order_id' => $order->OrderID]
                );
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning('Admin push failed: ' . $e->getMessage());
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => $order
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create order: ' . $e->getMessage()
            ], 500);
        }
    }
    
    public function show($id)
    {
        $order = Order::with(['orderDetails.menu', 'payment', 'customer'])->find($id);
        
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $order
        ]);
    }
    
    public function cancel(Request $request, $id)
    {
        $order = Order::where('OrderID', $id)
                     ->where('CustomerID', $request->user()->CustomerID)
                     ->first();
                     
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }
        
        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be cancelled'
            ], 422);
        }
        
        $order->update(['status' => 'cancelled']);
        
        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully'
        ]);
    }
    
    public function adminOrders(Request $request)
    {
        $query = Order::with(['orderDetails.menu', 'payment', 'customer']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $orders = $query->orderBy('created_at', 'desc')
                       ->paginate($request->get('per_page', 10));
                       
        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }
    
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,preparing,ready,delivered,cancelled'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $order = Order::find($id);
        
        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }
        
        $oldStatus = $order->status;
        $newStatus = $request->status;
        
        $order->update(['status' => $newStatus]);
        
        // Update payment status if order is delivered
        if ($newStatus === 'delivered') {
            $order->payment()->update(['payment_status' => 'paid']);
        }
        
        // Create notification for customer
        if ($oldStatus !== $newStatus) {
            // Load order details with menu for notification message
            $order->load('orderDetails.menu');
            
            // Get menu names from order details
            $menuNames = $order->orderDetails->pluck('menu.name')->take(2)->toArray();
            $totalItems = $order->orderDetails->count();
            $menuSummary = implode(', ', $menuNames);
            if ($totalItems > 2) {
                $menuSummary .= " dan " . ($totalItems - 2) . " menu lainnya";
            }
            
            $statusMessages = [
                'confirmed' => [
                    'title' => '🎉 Pesanan Dikonfirmasi!',
                    'message' => "Yeay! Pesanan kamu #{$order->OrderID} ({$menuSummary}) udah dikonfirmasi nih. Lagi diproses ya, ditunggu aja!"
                ],
                'preparing' => [
                    'title' => '👨‍🍳 Lagi Dimasakin Nih!',
                    'message' => "Pesanan kamu #{$order->OrderID} ({$menuSummary}) lagi dimasakin sama chef kita. Bentar lagi jadi!"
                ],
                'ready' => [
                    'title' => '✅ Pesanan Udah Siap!',
                    'message' => "Selesai! Pesanan #{$order->OrderID} ({$menuSummary}) udah siap nih. Sekarang lagi dalam perjalanan menuju kamu ya!"
                ],
                'delivered' => [
                    'title' => '✨ Pesanan Udah Sampai!',
                    'message' => "Pesanan #{$order->OrderID} ({$menuSummary}) udah sampai kan? Selamat menikmati ya! Jangan lupa order lagi 😋"
                ],
                'cancelled' => [
                    'title' => '❌ Pesanan Dibatalkan',
                    'message' => "Yaah, pesanan #{$order->OrderID} ({$menuSummary}) dibatalkan. Ada masalah? Hubungi kita ya!"
                ],
            ];
            
            if (isset($statusMessages[$newStatus])) {
                Notification::createForCustomer(
                    $order->CustomerID,
                    'order_status',
                    $statusMessages[$newStatus]['title'],
                    $statusMessages[$newStatus]['message'],
                    $order->OrderID
                );

                // Send Web Push notification to customer's device(s)
                try {
                    app(PushNotificationService::class)->sendToCustomer(
                        $order->CustomerID,
                        $statusMessages[$newStatus]['title'],
                        $statusMessages[$newStatus]['message'],
                        ['type' => 'order_status', 'order_id' => $order->OrderID]
                    );
                } catch (\Exception $e) {
                    // Don't fail the request if push notification fails
                    \Illuminate\Support\Facades\Log::warning('Push notification failed: ' . $e->getMessage());
                }
            }
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => $order->fresh(['orderDetails.menu', 'payment'])
        ]);
    }
}
