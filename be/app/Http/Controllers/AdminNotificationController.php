<?php

namespace App\Http\Controllers;

use App\Models\AdminNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminNotificationController extends Controller
{
    /**
     * Get notifications for authenticated admin.
     * Returns recent unread notifications and total unread count.
     */
    public function index(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $limit = $request->input('limit', 10);
        
        // Get unread notifications
        $notifications = AdminNotification::forAdmin($admin->AdminID)
            ->unread()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        // Get total unread count
        $unreadCount = AdminNotification::forAdmin($admin->AdminID)
            ->unread()
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount,
            ]
        ]);
    }

    /**
     * Get all notifications (paginated) for authenticated admin.
     */
    public function all(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $perPage = $request->input('per_page', 20);
        
        $notifications = AdminNotification::forAdmin($admin->AdminID)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications,
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $notification = AdminNotification::forAdmin($admin->AdminID)
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read.',
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request)
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        AdminNotification::forAdmin($admin->AdminID)
            ->unread()
            ->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read.',
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(Request $request, $id)
    {
        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        $notification = AdminNotification::forAdmin($admin->AdminID)
            ->where('id', $id)
            ->first();

        if (!$notification) {
            return response()->json(['success' => false, 'message' => 'Notification not found.'], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted.',
        ]);
    }
}
