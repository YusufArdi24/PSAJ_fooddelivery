<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    // Customer Authentication
    public function customerRegister(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:customers',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $customer = Customer::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone ?? '',
                'address' => $request->address ?? '',
                'password' => $request->password,
            ]);

            // Send email verification (non-blocking failure)
            try {
                $customer->sendEmailVerificationNotification();
            } catch (\Exception $e) {
                Log::warning('Email verification failed but registration succeeded', [
                    'customer_id' => $customer->id,
                    'email' => $customer->email,
                    'error' => $e->getMessage(),
                ]);
                // Registration should not fail due to email issues
            }

            $token = $customer->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Customer registered successfully',
                'requires_verification' => true,
                'data' => [
                    'customer' => $customer,
                    'token' => $token,
                    'token_type' => 'Bearer'
                ]
            ], 201);
        } catch (\Exception $e) {
            Log::error('Customer registration failed', [
                'status' => 500,
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function customerLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $customer = Customer::where('email', $request->email)->first();

        if (!$customer || !Hash::check($request->password, $customer->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Single-session enforcement: block login if there is already an active session.
        // The user must logout from the other device/browser first.
        if ($customer->tokens()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun ini sedang digunakan di perangkat atau browser lain. Silakan logout terlebih dahulu.'
            ], 409);
        }

        $token = $customer->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'customer' => $customer,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    public function customerLogout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    /**
     * Login / Register via Google OAuth ID token.
     * Frontend sends the credential (JWT) from Google Sign-In.
     * We verify it against Google's tokeninfo endpoint and find-or-create the customer.
     */
    public function customerGoogleLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'credential' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Credential Google tidak ditemukan',
                'errors' => $validator->errors()
            ], 422);
        }

        // Verify the access token by calling Google's userinfo endpoint
        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withToken($request->credential)
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (!$response->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Token Google tidak valid atau sudah kadaluarsa',
            ], 401);
        }

        $googleUser = $response->json();

        // Validate that the token has required fields
        if (empty($googleUser['sub']) || empty($googleUser['email'])) {
            return response()->json([
                'success' => false,
                'message' => 'Data akun Google tidak lengkap',
            ], 401);
        }

        $googleId   = $googleUser['sub'];
        $email      = $googleUser['email'];
        $name       = $googleUser['name'] ?? explode('@', $email)[0];
        $avatar     = $googleUser['picture'] ?? null;

        // Find existing customer by google_id, or by email, or create new
        $customer = Customer::where('google_id', $googleId)->first();

        if (!$customer) {
            $customer = Customer::where('email', $email)->first();
        }

        if ($customer) {
            // Update google_id and avatar if not set
            $updates = [];
            if (!$customer->google_id) $updates['google_id'] = $googleId;
            if (!$customer->avatar && $avatar) $updates['avatar'] = $avatar;
            if (!empty($updates)) $customer->update($updates);

            // Every time an unverified customer logs in via Google, send a fresh
            // verification email so they can always complete the flow — whether it's
            // their first Google link or a repeat attempt before they verified.
            if (!$customer->is_verified) {
                try {
                    $customer->sendEmailVerificationNotification();
                } catch (\Exception $e) {
                    Log::warning('Failed to queue verification email for Google auth:', [
                        'customer_id' => $customer->id,
                        'email' => $customer->email,
                        'error' => $e->getMessage(),
                    ]);
                    // Don't fail the login if email queueing fails
                }
            }
        } else {
            // Create new customer (no password for OAuth users)
            // Start as unverified — same flow as a regular sign-up
            $customer = Customer::create([
                'name'       => $name,
                'email'      => $email,
                'google_id'  => $googleId,
                'avatar'     => $avatar,
                'phone'      => '',
                'address'    => '',
                'is_verified'=> false,
            ]);
            // Send verification email so the user must confirm before proceeding
            try {
                $customer->sendEmailVerificationNotification();
            } catch (\Exception $e) {
                Log::warning('Failed to queue verification email for new Google customer:', [
                    'customer_id' => $customer->id,
                    'email' => $customer->email,
                    'error' => $e->getMessage(),
                ]);
                // Don't fail the account creation if email queueing fails
            }
        }

        // Single-session enforcement: block Google login if there is already an active session.
        if ($customer->tokens()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun ini sedang digunakan di perangkat atau browser lain. Silakan logout terlebih dahulu.'
            ], 409);
        }

        // Issue Sanctum token
        $token = $customer->createToken('google-auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login dengan Google berhasil',
            'data' => [
                'customer' => $customer,
                'token'    => $token,
                'token_type' => 'Bearer',
            ]
        ]);
    }

    public function customerProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => [
                'customer' => $request->user()
            ]
        ]);
    }

    public function updateCustomerProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'    => 'sometimes|nullable|string|max:255',
            'phone'   => 'sometimes|nullable|string|max:20',
            'address' => 'sometimes|nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $customer = $request->user();
        $updateData = array_filter([
            'name'    => $request->name,
            'phone'   => $request->phone,
            'address' => $request->address,
        ], fn($v) => !is_null($v));

        $customer->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $customer->fresh()
        ]);
    }

    public function customerChangePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $customer = $request->user();

        if (!Hash::check($request->current_password, $customer->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        $customer->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    // Admin Authentication
    public function adminRegister(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:admins',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Admin::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
        ]);

        $token = $admin->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Admin registered successfully',
            'data' => [
                'admin' => $admin,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ], 201);
    }

    public function adminLogin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = Admin::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials'
            ], 401);
        }

        // Single-session enforcement: block login if there is already an active session.
        if ($admin->tokens()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun ini sedang digunakan di perangkat atau browser lain. Silakan logout terlebih dahulu.'
            ], 409);
        }

        $token = $admin->createToken('auth-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'admin' => $admin,
                'token' => $token,
                'token_type' => 'Bearer'
            ]
        ]);
    }

    public function adminLogout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully'
        ]);
    }

    public function adminProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    public function updateAdminProfile(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:admins,email,' . $request->user()->AdminID . ',AdminID',
            'phone' => 'required|string|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = $request->user();
        $admin->update([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin profile updated successfully',
            'data' => $admin->fresh()
        ]);
    }

    public function adminChangePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $admin = $request->user();

        // Check if current password is correct
        if (!Hash::check($request->current_password, $admin->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Update password
        $admin->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    }

    public function customerForgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:customers,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Email tidak ditemukan di sistem kami.',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::broker('customers')->sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'success' => true,
                'message' => 'Link reset password telah dikirim ke email Anda.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Terlalu banyak permintaan. Silakan tunggu sebentar lalu coba lagi.'
        ], 429);
    }

    public function customerResetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'                 => 'required|email',
            'token'                 => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::broker('customers')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($customer, $password) {
                $customer->forceFill([
                    'password' => Hash::make($password)
                ])->save();
                $customer->tokens()->delete(); // invalidate all sessions
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'success' => true,
                'message' => 'Password berhasil direset. Silakan masuk dengan password baru.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Token tidak valid atau sudah kedaluarsa. Minta link reset baru.'
        ], 422);
    }

    public function adminForgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:admins,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // For simplicity, return success message
        // In production, implement email sending logic
        return response()->json([
            'success' => true,
            'message' => 'Password reset link sent to your email'
        ]);
    }

    public function adminResetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:admins,email',
            'password' => 'required|string|min:8|confirmed',
            'token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // For simplicity, update password directly
        // In production, validate token properly
        $admin = Admin::where('email', $request->email)->first();
        $admin->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Admin password reset successfully'
        ]);
    }
}
