<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Promo;
use Illuminate\Http\Request;

class PromoController extends Controller
{
    /**
     * Get active promos with menu details
     */
    public function index(Request $request)
    {
        $query = Promo::active()->with(['admin', 'menu']);
        
        $promos = $query->orderBy('created_at', 'desc')
                       ->paginate($request->get('per_page', 10));
                       
        return response()->json([
            'success' => true,
            'data' => $promos
        ]);
    }
    
    /**
     * Get promo by ID
     */
    public function show($id)
    {
        $promo = Promo::with(['admin', 'menu'])->find($id);
        
        if (!$promo) {
            return response()->json([
                'success' => false,
                'message' => 'Promo not found'
            ], 404);
        }
        
        if (!$promo->is_valid) {
            return response()->json([
                'success' => false,
                'message' => 'Promo is not active or has expired'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $promo
        ]);
    }
    
    /**
     * Get promo by menu ID
     */
    public function getByMenu($menuId)
    {
        $promo = Promo::where('MenuID', $menuId)
                     ->active()
                     ->with(['admin', 'menu'])
                     ->first();
                     
        if (!$promo) {
            return response()->json([
                'success' => false,
                'message' => 'No active promo for this menu'
            ], 404);
        }
        
        return response()->json([
            'success' => true,
            'data' => $promo
        ]);
    }
    
    /**
     * Get all promos (for customer view)
     */
    public function allPromos()
    {
        $promos = Promo::active()
                      ->with(['menu'])
                      ->orderBy('created_at', 'desc')
                      ->get();
                      
        return response()->json([
            'success' => true,
            'data' => $promos
        ]);
    }
    
    /**
     * Get menus with active promos
     */
    public function menusWithPromo()
    {
        $promos = Promo::active()
                      ->with(['menu'])
                      ->get();
        
        // Map to include discounted price
        $menusWithPromo = $promos->map(function($promo) {
            if (!$promo->menu) return null;
            
            return [
                'menu_id' => $promo->menu->MenuID,
                'menu_name' => $promo->menu->name,
                'original_price' => $promo->menu->price,
                'discounted_price' => $promo->discounted_price,
                'discount_amount' => $promo->calculateDiscount(),
                'discount_label' => $promo->formatted_discount,
                'promo_title' => $promo->title,
                'promo_description' => $promo->description,
                'start_date' => $promo->start_date,
                'end_date' => $promo->end_date,
                'image_url' => $promo->menu->image_url,
            ];
        })->filter();
                      
        return response()->json([
            'success' => true,
            'data' => $menusWithPromo->values()
        ]);
    }
}
