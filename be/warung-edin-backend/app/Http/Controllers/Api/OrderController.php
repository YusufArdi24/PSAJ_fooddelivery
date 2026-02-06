<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Menu;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class OrderController extends Controller
{
    public function customerOrders(Request $request)
    {
        $orders = Order::where('CustomerID', $request->user()->CustomerID)
                     ->with(['orderDetails.menu', 'payment'])
                     ->orderBy('created_at', 'desc')
                     ->paginate($request->get('per_page', 10));
                     
        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }
    
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,MenuID',
            'items.*.quantity' => 'required|integer|min:1',
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
                    'subtotal' => $itemTotal
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
                    'price' => $item['price']
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
        
        $order->update(['status' => $request->status]);
        
        // Update payment status if order is delivered
        if ($request->status === 'delivered') {
            $order->payment()->update(['payment_status' => 'paid']);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Order status updated successfully',
            'data' => $order->fresh(['orderDetails.menu', 'payment'])
        ]);
    }
}
