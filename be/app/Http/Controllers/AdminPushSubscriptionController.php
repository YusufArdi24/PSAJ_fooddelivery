<?php

namespace App\Http\Controllers;

use App\Models\AdminPushSubscription;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminPushSubscriptionController extends Controller
{
    /**
     * Store or update a push subscription for the authenticated admin (session auth).
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint'   => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        $admin = Auth::guard('admin')->user();

        if (!$admin) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated.'], 401);
        }

        AdminPushSubscription::updateOrCreate(
            [
                'AdminID'  => $admin->AdminID,
                'endpoint' => $request->endpoint,
            ],
            [
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
            ]
        );

        return response()->json(['success' => true, 'message' => 'Admin subscribed to push notifications']);
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
