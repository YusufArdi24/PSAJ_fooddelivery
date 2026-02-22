<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Store or update a push subscription for the authenticated customer.
     */
    public function subscribe(Request $request)
    {
        $request->validate([
            'endpoint'   => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        $customer = $request->user();

        PushSubscription::updateOrCreate(
            [
                'CustomerID' => $customer->CustomerID,
                'endpoint'   => $request->endpoint,
            ],
            [
                'public_key' => $request->public_key,
                'auth_token' => $request->auth_token,
            ]
        );

        return response()->json(['success' => true, 'message' => 'Subscribed to push notifications']);
    }

    /**
     * Remove a push subscription.
     */
    public function unsubscribe(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $customer = $request->user();

        PushSubscription::where('CustomerID', $customer->CustomerID)
            ->where('endpoint', $request->endpoint)
            ->delete();

        return response()->json(['success' => true, 'message' => 'Unsubscribed']);
    }

    /**
     * Return the VAPID public key so the frontend can subscribe.
     */
    public function vapidPublicKey()
    {
        return response()->json([
            'success'    => true,
            'public_key' => config('app.vapid_public_key'),
        ]);
    }
}
