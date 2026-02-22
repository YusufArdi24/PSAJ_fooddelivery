<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;

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
        
        // Add promo info to each menu
        $menus->getCollection()->transform(function ($menu) {
            return $this->appendPromoInfo($menu);
        });
        
        return response()->json([
            'success' => true,
            'data' => $menus
        ]);
    }
    
    public function show($id)
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
        
        return response()->json([
            'success' => true,
            'data' => $this->appendPromoInfo($menu)
        ]);
    }
    
    public function byCategory($category)
    {
        $menus = Menu::where('category', $category)
                    ->with(['admin', 'activePromo'])
                    ->get();
        
        $menus->transform(function ($menu) {
            return $this->appendPromoInfo($menu);
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
        
        $menus->transform(function ($menu) {
            return $this->appendPromoInfo($menu);
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
        
        $updatedMenus->transform(function ($menu) {
            return $this->appendPromoInfo($menu);
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
}
