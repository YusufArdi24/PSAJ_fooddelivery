<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $query = Menu::with(['admin', 'activePromo']);
        
        // Filter by category if provided
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        
        // Search by name if provided
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        
        $menus = $query->paginate($request->get('per_page', 10));
        
        // Get popular and recommended menu IDs
        $popularMenuId = $this->getTodayPopularMenuId();
        $recommendedMenuIds = [];
        
        // Get customer ID from authorization header if available
        $user = $request->user('sanctum');
        if ($user) {
            $recommendedMenuIds = $this->getRecommendedMenuIds($user->CustomerID);
        }
        
        // Add promo info and recommendation flags to each menu
        $menus->getCollection()->transform(function ($menu) use ($popularMenuId, $recommendedMenuIds) {
            $menu = $this->appendPromoInfo($menu);
            $menu->is_popular_today = ($menu->MenuID === $popularMenuId);
            $menu->is_recommended_today = in_array($menu->MenuID, $recommendedMenuIds);
            return $menu;
        });
        
        return response()->json([
            'success' => true,
            'data' => $menus
        ]);
    }
    
    public function show($id, Request $request)
    {
        $menu = Menu::with(['admin', 'activePromo'])->find($id);
        
        if (!$menu) {
            return response()->json([
                'success' => false,
                'message' => 'Menu not found'
            ], 404);
        }
        
        if (!$menu->is_available) {
            return response()->json([
                'success' => false,
                'message' => 'Menu is not available'
            ], 404);
        }
        
        // Get popular and recommended menu IDs
        $popularMenuId = $this->getTodayPopularMenuId();
        $recommendedMenuIds = [];
        
        // Get customer ID from authorization header if available
        $user = $request->user('sanctum');
        if ($user) {
            $recommendedMenuIds = $this->getRecommendedMenuIds($user->CustomerID);
        }
        
        $menu = $this->appendPromoInfo($menu);
        $menu->is_popular_today = ($menu->MenuID === $popularMenuId);
        $menu->is_recommended_today = in_array($menu->MenuID, $recommendedMenuIds);
        
        return response()->json([
            'success' => true,
            'data' => $menu
        ]);
    }
    
    public function byCategory($category)
    {
        $menus = Menu::where('category', $category)
                    ->with(['admin', 'activePromo'])
                    ->get();
        
        // Get popular and recommended menu IDs
        $popularMenuId = $this->getTodayPopularMenuId();
        $recommendedMenuIds = [];
        
        // Get customer ID from authorization header if available
        if ($request = request()) {
            $user = $request->user('sanctum');
            if ($user) {
                $recommendedMenuIds = $this->getRecommendedMenuIds($user->CustomerID);
            }
        }
        
        $menus->transform(function ($menu) use ($popularMenuId, $recommendedMenuIds) {
            $menu = $this->appendPromoInfo($menu);
            $menu->is_popular_today = ($menu->MenuID === $popularMenuId);
            $menu->is_recommended_today = in_array($menu->MenuID, $recommendedMenuIds);
            return $menu;
        });
                    
        return response()->json([
            'success' => true,
            'data' => $menus
        ]);
    }
    
    /**
     * Get recently added menus (last 7 days)
     */
    public function recentMenus(Request $request)
    {
        $days = $request->get('days', 7);
        
        $menus = Menu::where('is_available', true)
                    ->where('created_at', '>=', now()->subDays($days))
                    ->with(['admin', 'activePromo'])
                    ->orderBy('created_at', 'desc')
                    ->get();
        
        // Get popular and recommended menu IDs
        $popularMenuId = $this->getTodayPopularMenuId();
        $recommendedMenuIds = [];
        
        // Get customer ID from authorization header if available
        $user = $request->user('sanctum');
        if ($user) {
            $recommendedMenuIds = $this->getRecommendedMenuIds($user->CustomerID);
        }
        
        $menus->transform(function ($menu) use ($popularMenuId, $recommendedMenuIds) {
            $menu = $this->appendPromoInfo($menu);
            $menu->is_popular_today = ($menu->MenuID === $popularMenuId);
            $menu->is_recommended_today = in_array($menu->MenuID, $recommendedMenuIds);
            return $menu;
        });
                    
        return response()->json([
            'success' => true,
            'data' => $menus,
            'count' => $menus->count()
        ]);
    }
    
    /**
     * Get menu updates (price changes, etc) since a given timestamp
     */
    public function menuUpdates(Request $request)
    {
        $since = $request->get('since');
        
        if (!$since) {
            return response()->json([
                'success' => false,
                'message' => 'Parameter "since" is required (timestamp)'
            ], 400);
        }
        
        $updatedMenus = Menu::where('updated_at', '>', $since)
                           ->where('created_at', '<', $since) // Only updates, not new items
                           ->with(['admin', 'activePromo'])
                           ->orderBy('updated_at', 'desc')
                           ->get();
        
        // Get popular and recommended menu IDs
        $popularMenuId = $this->getTodayPopularMenuId();
        $recommendedMenuIds = [];
        
        // Get customer ID from authorization header if available
        $user = $request->user('sanctum');
        if ($user) {
            $recommendedMenuIds = $this->getRecommendedMenuIds($user->CustomerID);
        }
        
        $updatedMenus->transform(function ($menu) use ($popularMenuId, $recommendedMenuIds) {
            $menu = $this->appendPromoInfo($menu);
            $menu->is_popular_today = ($menu->MenuID === $popularMenuId);
            $menu->is_recommended_today = in_array($menu->MenuID, $recommendedMenuIds);
            return $menu;
        });
                           
        return response()->json([
            'success' => true,
            'data' => $updatedMenus,
            'count' => $updatedMenus->count()
        ]);
    }
    
    /**
     * Helper method to append promo information to menu
     */
    private function appendPromoInfo($menu)
    {
        $promo = $menu->activePromo;
        
        if ($promo) {
            $menu->has_promo = true;
            $menu->promo = [
                'PromoID' => $promo->PromoID,
                'title' => $promo->title,
                'promo_type' => $promo->promo_type,
                'discount_value' => $promo->discount_value,
                'formatted_discount' => $promo->formatted_discount,
                'start_date' => $promo->start_date,
                'end_date' => $promo->end_date,
            ];
            $menu->original_price = $menu->price;
            $menu->discounted_price = $promo->discounted_price;
            $menu->formatted_original_price = 'Rp ' . number_format($menu->price, 0, ',', '.');
            $menu->formatted_discounted_price = 'Rp ' . number_format($promo->discounted_price, 0, ',', '.');
            // Update the main price to show discounted price
            $menu->display_price = $promo->discounted_price;
            $menu->formatted_price = 'Rp ' . number_format($promo->discounted_price, 0, ',', '.');
        } else {
            $menu->has_promo = false;
            $menu->promo = null;
            $menu->display_price = $menu->price;
        }
        
        // Remove the activePromo relationship from output to avoid duplication
        unset($menu->activePromo);
        
        return $menu;
    }
    
    /**
     * Get today's most popular menu based on order count
     * Returns the MenuID of the most ordered menu today
     */
    private function getTodayPopularMenuId()
    {
        $popularMenu = DB::table('order_details')
            ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
            ->join('menus', 'order_details.MenuID', '=', 'menus.MenuID')
            ->whereDate('orders.order_date', now()->toDateString())
            ->where('menus.is_available', true)
            ->select('order_details.MenuID', DB::raw('SUM(order_details.quantity) as total_orders'))
            ->groupBy('order_details.MenuID')
            ->orderByDesc('total_orders')
            ->first();
        
        return $popularMenu ? $popularMenu->MenuID : null;
    }
    
    /**
     * Get recommended menu IDs for a customer using Collaborative Filtering
     * Based on: "Users who bought the same items also bought these"
     * 
     * @param int $customerId
     * @return array Array of recommended MenuIDs
     */
    private function getRecommendedMenuIds($customerId)
    {
        // Step 1: Get items that this customer has ordered
        $customerMenus = DB::table('order_details')
            ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
            ->where('orders.CustomerID', $customerId)
            ->distinct()
            ->pluck('order_details.MenuID')
            ->toArray();
        
        if (empty($customerMenus)) {
            return [];
        }
        
        // Step 2: Find other customers who ordered the same items
        $similarCustomers = DB::table('order_details')
            ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
            ->whereIn('order_details.MenuID', $customerMenus)
            ->where('orders.CustomerID', '!=', $customerId)
            ->distinct()
            ->pluck('orders.CustomerID')
            ->toArray();
        
        if (empty($similarCustomers)) {
            return [];
        }
        
        // Step 3: Find what else those similar customers ordered
        // that the current customer hasn't ordered yet
        $recommendations = DB::table('order_details')
            ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
            ->join('menus', 'order_details.MenuID', '=', 'menus.MenuID')
            ->whereIn('orders.CustomerID', $similarCustomers)
            ->whereNotIn('order_details.MenuID', $customerMenus)
            ->where('menus.is_available', true)
            ->select('order_details.MenuID', DB::raw('COUNT(DISTINCT orders.CustomerID) as customer_count'))
            ->groupBy('order_details.MenuID')
            ->orderByDesc('customer_count')
            ->limit(3) // Top 3 recommendations
            ->pluck('MenuID')
            ->toArray();
        
        return $recommendations;
    }
}
