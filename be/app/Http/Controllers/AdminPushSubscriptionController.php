<?php

namespace App\Http\Controllers;

use App\Models\AdminPushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class AdminPushSubscriptionController extends Controller
{
    /**
     * Store or update a push subscription for the authenticated admin (session auth).
     */
    public function subscribe(Request $request)
    {
        Log::info('[AdminPushSubscription] Subscribe request received', [
            'has_endpoint' => $request->has('endpoint'),
            'has_public_key' => $request->has('public_key'),
            'has_auth_token' => $request->has('auth_token'),
            'admin_guard' => Auth::guard('admin')->check(),
        ]);

        $request->validate([
            'endpoint'   => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            Log::warning('[AdminPushSubscription] Admin not authenticated');
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        Log::info('[AdminPushSubscription] Creating subscription for admin', [
            'admin_id' => $admin->AdminID,
            'admin_name' => $admin->name,
            'endpoint_preview' => substr($request->endpoint, 0, 50) . '...',
        ]);

        $subscription = AdminPushSubscription::updateOrCreate(
            [
                'AdminID'  => $admin->AdminID,
                'endpoint' => $request->endpoint,
            ],
            [
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
            ]
        );

        Log::info('[AdminPushSubscription] Subscription saved', [
            'subscription_id' => $subscription->id,
            'admin_id' => $admin->AdminID,
        ]);

        return response()->json(['success' => true, 'message' => 'Admin subscribed to push notifications', 'subscription_id' => $subscription->id]);
    }

    /**
     * Remove a push subscription.
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        AdminPushSubscription::where('AdminID', $admin->AdminID)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json(['success' => true, 'message' => 'Unsubscribed']);
    }
}
