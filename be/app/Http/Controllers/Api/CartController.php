<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Payment;
use App\Models\Promo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CartController extends Controller
{
    /**
     * Get all cart items for customer
     */
    public function index(Request $request)
    {
        $cartItems = Cart::where('CustomerID', $request->user()->CustomerID)
                        ->with('menu')
                        ->get();

        // Use snapshot prices from cart (prices at time of adding to cart)
        $total = $cartItems->sum('subtotal');
        $itemCount = $cartItems->sum('quantity');

        return response()->json([
            'success' => true,
            'data' => [
                'items' => $cartItems,
                'total_price' => $total,
                'total_items' => $itemCount
            ]
        ]);
    }

    /**
     * Add item to cart
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'menu_id' => 'required|exists:menus,MenuID',
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $menu = Menu::where('MenuID', $request->menu_id)
                   ->where('is_available', true)
                   ->first();

        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Menu not available'
            ], 422);
        }

        $customerID = $request->user()->CustomerID;

        // Check if item already exists in cart
        $existingItem = Cart::where('CustomerID', $customerID)
                           ->where('MenuID', $request->menu_id)
                           ->first();

        if ($existingItem) {
            // Update quantity if item exists
            $existingItem->quantity += $request->quantity;
            $existingItem->save();
            $cartItem = $existingItem;
        } else {
            // Create new cart item
            $cartItem = Cart::create([
                'CustomerID' => $customerID,
                'MenuID' => $request->menu_id,
                'quantity' => $request->quantity,
                'price' => $menu->price,
            ]);
        }

        $cartItem->load('menu');

        return response()->json([
            'success' => true,
            'message' => 'Item added to cart successfully',
            'data' => $cartItem
        ], 201);
    }

    /**
     * Update cart item quantity
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $cartItem = Cart::where('CartID', $id)
                       ->where('CustomerID', $request->user()->CustomerID)
                       ->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found'
            ], 404);
        }

        $cartItem->quantity = $request->quantity;
        $cartItem->save();
        $cartItem->load('menu');

        return response()->json([
            'success' => true,
            'message' => 'Cart item updated successfully',
            'data' => $cartItem
        ]);
    }

    /**
     * Remove item from cart
     */
    public function destroy(Request $request, $id)
    {
        $cartItem = Cart::where('CartID', $id)
                       ->where('CustomerID', $request->user()->CustomerID)
                       ->first();

        if (!$cartItem) {
            return response()->json([
                'success' => false,
                'message' => 'Cart item not found'
            ], 404);
        }

        $cartItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item removed from cart successfully'
        ]);
    }

    /**
     * Clear all cart items
     */
    public function clear(Request $request)
    {
        Cart::where('CustomerID', $request->user()->CustomerID)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Cart cleared successfully'
        ]);
    }

    /**
     * Checkout - Convert cart to order
     */
    public function checkout(Request $request)
    {
        $validator = Validator::make($request->all(), [
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

        $customerID = $request->user()->CustomerID;
        
        $cartItems = Cart::where('CustomerID', $customerID)
                        ->with(['menu.activePromo'])
                        ->get();

        if ($cartItems->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Cart is empty'
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Calculate totals with discount
            $totalOriginal = 0;
            $totalDiscount = 0;

            $itemsData = $cartItems->map(function ($cartItem) use (&$totalOriginal, &$totalDiscount) {
                // Use snapshot price from cart (price at time of adding to cart)
                // This ensures order reflects the price when customer added item, not current menu price
                $originalPrice = $cartItem->price;
                
                // Get active promo - refresh to ensure we get the latest active promo
                $promo = null;
                if ($cartItem->menu) {
                    $promo = Promo::where('MenuID', $cartItem->MenuID)
                        ->where('is_active', true)
                        ->where('start_date', '<=', now())
                        ->where('end_date', '>=', now())
                        ->orderBy('created_at', 'desc')
                        ->first();
                }
                
                $discountPerItem = $promo ? $promo->calculateDiscount($originalPrice) : 0;
                $discountedPrice = max(0, $originalPrice - $discountPerItem);

                $totalOriginal += $originalPrice * $cartItem->quantity;
                $totalDiscount += $discountPerItem * $cartItem->quantity;

                return [
                    'cartItem'       => $cartItem,
                    'originalPrice'  => $originalPrice,
                    'discountPerItem'=> $discountPerItem,
                    'discountedPrice'=> $discountedPrice,
                ];
            });

            $totalPrice = $totalOriginal - $totalDiscount;

            // Create order
            $order = Order::create([
                'CustomerID'      => $customerID,
                'order_date'      => now(),
                'total_price'     => $totalPrice,
                'discount_amount' => $totalDiscount,
                'status'          => 'pending',
                'notes'           => $request->notes
            ]);

            // Create order details from cart items
            foreach ($itemsData as $item) {
                $cartItem = $item['cartItem'];

                // Verify menu is still available
                if (!$cartItem->menu->is_available) {
                    DB::rollback();
                    return response()->json([
                        'success' => false,
                        'message' => 'Menu "' . $cartItem->menu->name . '" is no longer available'
                    ], 422);
                }

                OrderDetail::create([
                    'OrderID'          => $order->OrderID,
                    'MenuID'           => $cartItem->MenuID,
                    'menu_name'        => $cartItem->menu->name,
                    'quantity'         => $cartItem->quantity,
                    'price'            => $item['discountedPrice'],
                    'original_price'   => $item['originalPrice'],
                    'discount_per_item'=> $item['discountPerItem'],
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

            // Clear cart
            Cart::where('CustomerID', $customerID)->delete();

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
}
