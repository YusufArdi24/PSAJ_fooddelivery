<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Hash;

class AdminVerificationController extends Controller
{
    /**
     * Mark the authenticated admin's email address as verified.
     */
    public function verify(Request $request, $id, $hash)
    {
        $admin = Admin::find($id);
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found.'
            ], 404);
        }

        // Verify the hash matches the admin's email
        if (!hash_equals((string) $hash, sha1($admin->getEmailForVerification()))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid verification link.'
            ], 403);
        }

        // Check if URL signature is valid
        if (!URL::hasValidSignature($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired verification link.'
            ], 403);
        }

        if ($admin->hasVerifiedEmail()) {
            return response()->json([
                'success' => true,
                'message' => 'Email already verified.'
            ]);
        }

        if ($admin->markEmailAsVerified()) {
            event(new Verified($admin));
        }

        return response()->json([
            'success' => true,
            'message' => 'Admin email has been verified successfully!'
        ]);
    }

    /**
     * Resend the email verification notification.
     */
    public function resend(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $admin = Admin::where('email', $request->email)->first();
        
        if (!$admin) {
            return response()->json([
                'success' => false,
                'message' => 'Admin not found.'
            ], 404);
        }

        if ($admin->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Email is already verified.'
            ], 400);
        }

        $admin->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Verification link sent!'
        ]);
    }
}