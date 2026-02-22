<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Get customer notifications
     */
    public function index(Request $request)
    {
        $query = Notification::where('CustomerID', $request->user()->CustomerID)
                            ->with(['order', 'menu'])
                            ->orderBy('created_at', 'desc');
        
        // Filter by type if provided
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        
        // Filter by read status if provided
        if ($request->has('unread_only') && $request->unread_only) {
            $query->where('read', false);
        }
        
        $notifications = $query->paginate($request->get('per_page', 20));
        
        return response()->json([
            'success' => true,
            'data' => $notifications
        ]);
    }
    
    /**
     * Get unread count
     */
    public function unreadCount(Request $request)
    {
        $count = Notification::where('CustomerID', $request->user()->CustomerID)
                            ->where('read', false)
                            ->count();
        
        return response()->json([
            'success' => true,
            'count' => $count
        ]);
    }
    
    /**
     * Mark notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::where('id', $id)
                                   ->where('CustomerID', $request->user()->CustomerID)
                                   ->first();
        
        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }
        
        $notification->markAsRead();
        
        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read'
        ]);
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        Notification::where('CustomerID', $request->user()->CustomerID)
                   ->where('read', false)
                   ->update([
                       'read' => true,
                       'read_at' => now()
                   ]);
        
        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read'
        ]);
    }
    
    /**
     * Delete notification
     */
    public function destroy(Request $request, $id)
    {
        $notification = Notification::where('id', $id)
                                   ->where('CustomerID', $request->user()->CustomerID)
                                   ->first();
        
        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }
        
        $notification->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Notification deleted'
        ]);
    }
    
    /**
     * Delete all read notifications
     */
    public function deleteAllRead(Request $request)
    {
        $deleted = Notification::where('CustomerID', $request->user()->CustomerID)
                              ->where('read', true)
                              ->delete();
        
        return response()->json([
            'success' => true,
            'message' => "$deleted notifications deleted"
        ]);
    }

    /**
     * Delete ALL notifications (read and unread)
     */
    public function deleteAll(Request $request)
    {
        $deleted = Notification::where('CustomerID', $request->user()->CustomerID)->delete();

        return response()->json([
            'success' => true,
            'message' => "$deleted notifications deleted"
        ]);
    }
}
