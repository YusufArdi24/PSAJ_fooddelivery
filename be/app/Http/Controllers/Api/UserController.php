<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class UserController extends Controller
{
    /**
     * Display a listing of users (customers)
     */
    public function index(Request $request)
    {
        $query = Customer::query();
        
        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }
        
        // Filter by email verification status
        if ($request->has('verified')) {
            if ($request->verified === 'true') {
                $query->whereNotNull('email_verified_at');
            } else {
                $query->whereNull('email_verified_at');
            }
        }
        
        $users = $query->withCount('orders')
                      ->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 10));
        
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customers',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Customer::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user->loadCount('orders')
        ], 201);
    }

    /**
     * Display the specified user
     */
    public function show($id)
    {
        $user = Customer::with(['orders.orderDetails.menu', 'orders.payment'])
                       ->withCount('orders')
                       ->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Calculate total spent
        $totalSpent = $user->orders->where('status', 'delivered')->sum('total_price');
        $user->total_spent = $totalSpent;

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, $id)
    {
        $user = Customer::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customers,email,' . $id . ',CustomerID',
            'phone' => 'required|string|max:20',
            'address' => 'required|string|max:500',
            'password' => 'nullable|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh()->loadCount('orders')
        ]);
    }

    /**
     * Remove the specified user
     */
    public function destroy($id)
    {
        $user = Customer::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Check if user has pending orders
        $hasPendingOrders = $user->orders()
                                ->whereIn('status', ['pending', 'confirmed', 'preparing', 'ready'])
                                ->exists();

        if ($hasPendingOrders) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete user with pending orders'
            ], 422);
        }

        $userName = $user->name;
        $user->delete();

        return response()->json([
            'success' => true,
            'message' => "User '{$userName}' deleted successfully"
        ]);
    }

    /**
     * Toggle user email verification status
     */
    public function toggleVerification($id)
    {
        $user = Customer::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        if ($user->email_verified_at) {
            $user->update(['email_verified_at' => null]);
            $message = 'User email verification removed';
        } else {
            $user->update(['email_verified_at' => now()]);
            $message = 'User email verified';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $user->fresh()
        ]);
    }

    /**
     * Get user statistics
     */
    public function statistics()
    {
        $totalUsers = Customer::count();
        $verifiedUsers = Customer::whereNotNull('email_verified_at')->count();
        $unverifiedUsers = Customer::whereNull('email_verified_at')->count();
        $usersWithOrders = Customer::has('orders')->count();
        $newUsersToday = Customer::whereDate('created_at', today())->count();
        $newUsersThisWeek = Customer::whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count();
        $newUsersThisMonth = Customer::whereMonth('created_at', now()->month)
                                   ->whereYear('created_at', now()->year)
                                   ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_users' => $totalUsers,
                'verified_users' => $verifiedUsers,
                'unverified_users' => $unverifiedUsers,
                'users_with_orders' => $usersWithOrders,
                'new_users_today' => $newUsersToday,
                'new_users_this_week' => $newUsersThisWeek,
                'new_users_this_month' => $newUsersThisMonth,
                'verification_rate' => $totalUsers > 0 ? round(($verifiedUsers / $totalUsers) * 100, 2) : 0,
                'active_user_rate' => $totalUsers > 0 ? round(($usersWithOrders / $totalUsers) * 100, 2) : 0,
            ]
        ]);
    }

    /**
     * Get all customers
     */
    public function getAllCustomers(Request $request)
    {
        try {
            $query = Customer::query();

            // Optional search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Get with order count
            $customers = $query->withCount('orders')
                             ->orderBy('created_at', 'desc');

            // Check if pagination is needed
            if ($request->has('per_page')) {
                $customers = $customers->paginate($request->get('per_page', 15));
            } else {
                $customers = $customers->get();
            }

            return response()->json([
                'success' => true,
                'message' => 'All customers retrieved successfully',
                'data' => $customers,
                'meta' => [
                    'total' => $customers instanceof \Illuminate\Pagination\LengthAwarePaginator ? 
                              $customers->total() : $customers->count()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customers',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all admins
     */
    public function getAllAdmins(Request $request)
    {
        try {
            $query = \App\Models\Admin::query();

            // Optional search
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            // Get with menu count
            $admins = $query->withCount('menus')
                           ->orderBy('created_at', 'desc');

            // Check if pagination is needed
            if ($request->has('per_page')) {
                $admins = $admins->paginate($request->get('per_page', 15));
            } else {
                $admins = $admins->get();
            }

            return response()->json([
                'success' => true,
                'message' => 'All admins retrieved successfully',
                'data' => $admins,
                'meta' => [
                    'total' => $admins instanceof \Illuminate\Pagination\LengthAwarePaginator ? 
                              $admins->total() : $admins->count()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve admins',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an admin
     */
    public function deleteAdmin(Request $request, $id)
    {
        try {
            $currentAdmin = $request->user();
            
            // Prevent admin from deleting themselves
            if ($currentAdmin->AdminID == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account'
                ], 422);
            }

            $admin = \App\Models\Admin::find($id);

            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
                ], 404);
            }

            // Check if admin has related data that might prevent deletion
            $menusCount = $admin->menus()->count();
            
            if ($menusCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot delete admin. This admin has ' . $menusCount . ' menu(s) associated. Please reassign or delete the menus first.'
                ], 422);
            }

            // Delete admin tokens first
            $admin->tokens()->delete();
            
            // Delete admin
            $admin->delete();

            return response()->json([
                'success' => true,
                'message' => 'Admin deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get authenticated customer profile
     */
    public function getProfile(Request $request)
    {
        try {
            $customer = $request->user();
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $customer->load(['orders' => function($query) {
                $query->orderBy('created_at', 'desc')->limit(5);
            }]);
            
            Log::info('Get profile successful', [
                'customer_id' => $customer->CustomerID,
                'has_avatar' => !empty($customer->avatar)
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'customer' => $customer
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update authenticated customer profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $customer = $request->user();
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'email' => 'sometimes|string|email|max:255|unique:customers,email,' . $customer->CustomerID . ',CustomerID',
                'phone' => 'sometimes|string|max:20',
                'address' => 'sometimes|string|max:500',
                'password' => 'sometimes|string|min:8|confirmed',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only(['name', 'email', 'phone', 'address']);

            // Only update password if provided
            if ($request->filled('password')) {
                $updateData['password'] = Hash::make($request->password);
            }

            $customer->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => [
                    'customer' => $customer->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload avatar for authenticated customer
     */
    public function uploadAvatar(Request $request)
    {
        try {
            $customer = $request->user();
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'avatar' => 'required|image|mimes:jpeg,jpg,png,gif|max:2048', // Max 2MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Delete old avatar if exists
            if ($customer->avatar && Storage::disk('public')->exists($customer->avatar)) {
                Storage::disk('public')->delete($customer->avatar);
            }

            // Store new avatar
            $avatarPath = $request->file('avatar')->store('avatars', 'public');

            // Update customer record
            $customer->update(['avatar' => $avatarPath]);
            
            // Get avatar URL
            $avatarUrl = Storage::url($avatarPath);
            
            Log::info('Avatar uploaded successfully', [
                'customer_id' => $customer->CustomerID,
                'avatar_path' => $avatarPath,
                'avatar_url' => $avatarUrl
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Avatar uploaded successfully',
                'data' => [
                    'avatar' => $avatarPath,
                    'avatar_url' => $avatarUrl,
                    'customer' => $customer->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload avatar',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update location for authenticated customer
     */
    public function updateLocation(Request $request)
    {
        try {
            $customer = $request->user();
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'latitude' => 'required|numeric|between:-90,90',
                'longitude' => 'required|numeric|between:-180,180',
                'address' => 'sometimes|string|max:500',
                'address_label' => 'sometimes|string|max:100',
                'address_notes' => 'sometimes|string|max:500',
            ]);

            if ($validator->fails()) {
                Log::error('Location update validation failed', [
                    'errors' => $validator->errors(),
                    'request_data' => $request->all()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: ' . $validator->errors()->first(),
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'latitude' => $request->latitude,
                'longitude' => $request->longitude,
            ];

            // Update address if provided
            if ($request->filled('address')) {
                $updateData['address'] = $request->address;
            }

            // Update address label if provided
            if ($request->filled('address_label')) {
                $updateData['address_label'] = $request->address_label;
            }

            // Update address notes if provided
            if ($request->filled('address_notes')) {
                $updateData['address_notes'] = $request->address_notes;
            }

            $customer->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Location updated successfully',
                'data' => [
                    'customer' => $customer->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update location',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}