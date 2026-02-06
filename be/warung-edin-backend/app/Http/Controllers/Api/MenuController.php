<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Http\Request;

class MenuController extends Controller
{
    public function index(Request $request)
    {
        $query = Menu::where('is_available', true)->with('admin');
        
        // Filter by category if provided
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }
        
        // Search by name if provided
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        
        $menus = $query->paginate($request->get('per_page', 10));
        
        return response()->json([
            'success' => true,
            'data' => $menus
        ]);
    }
    
    public function show($id)
    {
        $menu = Menu::with('admin')->find($id);
        
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
            'data' => $menu
        ]);
    }
    
    public function byCategory($category)
    {
        $menus = Menu::where('category', $category)
                    ->where('is_available', true)
                    ->with('admin')
                    ->get();
                    
        return response()->json([
            'success' => true,
            'data' => $menus
        ]);
    }
}
