<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class CustomerVerificationController extends Controller
{
    /**
     * Verify email via frontend-initiated call (no signed URL middleware).
     * Frontend sends: id, hash, email
     */
    public function verify(Request $request)
    {
        $request->validate([
            'id'   => 'required',
            'hash' => 'required|string',
            'email' => 'required|email',
        ]);

        $customer = Customer::find($request->id);

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak ditemukan.'
            ], 404);
        }

        // Verify hash matches email
        if (!hash_equals((string) $request->hash, sha1($customer->getEmailForVerification()))) {
            return response()->json([
                'success' => false,
                'message' => 'Link verifikasi tidak valid.'
            ], 403);
        }

        if ($customer->hasVerifiedEmail()) {
            // Ensure is_verified is in sync even if it was somehow false
            if (!$customer->is_verified) {
                $customer->update(['is_verified' => true]);
            }
            // Revoke old tokens and issue a fresh one so the frontend is always authenticated
            $customer->tokens()->delete();
            $token = $customer->createToken('auth-token')->plainTextToken;
            return response()->json([
                'success' => true,
                'message' => 'Email sudah diverifikasi sebelumnya.',
                'already_verified' => true,
                'data' => [
                    'token'    => $token,
                    'customer' => $customer->fresh(),
                ],
            ]);
        }

        if ($customer->markEmailAsVerified()) {
            // Also flip the custom is_verified flag so the frontend sees it immediately
            $customer->update(['is_verified' => true]);
            event(new Verified($customer));
        }

        // Revoke old tokens and issue a fresh one so the frontend is always authenticated
        $customer->tokens()->delete();
        $token = $customer->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Email berhasil diverifikasi!',
            'data' => [
                'token'    => $token,
                'customer' => $customer->fresh(),
            ],
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

        $customer = Customer::where('email', $request->email)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak ditemukan.'
            ], 404);
        }

        if ($customer->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Email sudah diverifikasi.'
            ], 400);
        }

        $customer->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Link verifikasi telah dikirim ulang!'
        ]);
    }
}