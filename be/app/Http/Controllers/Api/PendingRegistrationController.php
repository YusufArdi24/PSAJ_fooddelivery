<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\OtpVerificationMail;
use App\Models\Customer;
use App\Models\PendingRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PendingRegistrationController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 – Standard sign-up: store pending, send OTP
    // ─────────────────────────────────────────────────────────────────────────
    public function preRegister(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'                  => 'required|string|max:255',
            'email'                 => 'required|email|max:255',
            'password'              => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Reject if already a verified customer
        $existingCustomer = Customer::where('email', $request->email)->first();
        if ($existingCustomer && $existingCustomer->is_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Email sudah digunakan oleh akun yang sudah terverifikasi.',
                'errors'  => ['email' => ['Email sudah terdaftar.']],
            ], 422);
        }

        // Allow re-registration for unverified customers (they never finished)
        if ($existingCustomer && !$existingCustomer->is_verified) {
            // Clean up old unverified customer so the pending flow takes over
            $existingCustomer->tokens()->delete();
            $existingCustomer->delete();
        }

        $otp     = (string) random_int(100000, 999999);
        $pending = PendingRegistration::updateOrCreate(
            ['email' => $request->email],
            [
                'type'               => 'email',
                'name'               => $request->name,
                'password_encrypted' => Crypt::encryptString($request->password),
                'google_id'          => null,
                'google_avatar'      => null,
                'pending_token'      => Str::random(64),
                'otp'                => $otp,
                'otp_expires_at'     => now()->addMinutes(10),
                'email_verified'     => false,
                'expires_at'         => now()->addHours(24),
            ]
        );

        try {
            // Send email immediately with retry logic - won't block registration if email service fails
            $this->sendEmailWithRetry($request->email, $otp, $request->name);
            Log::info('OTP email sent successfully', ['email' => $request->email]);
        } catch (\Exception $e) {
            // Log error but don't fail registration - email can be retried manually
            Log::warning('Failed to send OTP email for registration', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            // Note: Registration succeeds even if email fails - user can request email resend
        }

        return response()->json([
            'success'       => true,
            'message'       => 'Kode OTP telah dikirimkan ke email Anda.',
            'pending_token' => $pending->pending_token,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 (Google) – Verify with Google, decide login vs pending
    // ─────────────────────────────────────────────────────────────────────────
    public function googleAuth(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'access_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Access token tidak ditemukan',
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Verify token via Google userinfo endpoint
        /** @var \Illuminate\Http\Client\Response $googleResponse */
        $googleResponse = Http::withToken($request->access_token)
            ->get('https://www.googleapis.com/oauth2/v3/userinfo');

        if (!$googleResponse->successful()) {
            return response()->json([
                'success' => false,
                'message' => 'Token Google tidak valid atau sudah kadaluarsa.',
            ], 401);
        }

        $googleUser = $googleResponse->json();

        if (empty($googleUser['sub']) || empty($googleUser['email'])) {
            return response()->json([
                'success' => false,
                'message' => 'Data akun Google tidak lengkap.',
            ], 401);
        }

        $googleId        = $googleUser['sub'];
        $email           = $googleUser['email'];
        $name            = $googleUser['name'] ?? explode('@', $email)[0];
        $avatar          = $googleUser['picture'] ?? null;
        $googleVerified  = !empty($googleUser['email_verified']); // Google already confirmed the email

        // ── Case 1: Existing VERIFIED customer → normal login
        $customer = Customer::where('google_id', $googleId)->orWhere('email', $email)->first();

        if ($customer && $customer->is_verified) {
            // Update google_id / avatar if missing
            $updates = [];
            if (!$customer->google_id) $updates['google_id'] = $googleId;
            if (!$customer->avatar && $avatar) $updates['avatar'] = $avatar;
            if (!empty($updates)) $customer->update($updates);

            // Single-session: revoke old tokens before issuing a new one
            $customer->tokens()->delete();
            $token = $customer->createToken('auth-token')->plainTextToken;

            return response()->json([
                'success'    => true,
                'is_login'   => true,
                'needs_otp'  => false,
                'message'    => 'Login berhasil.',
                'data'       => [
                    'customer'   => $customer,
                    'token'      => $token,
                    'token_type' => 'Bearer',
                ],
            ]);
        }

        // ── Case 2: Unverified or new customer → pending registration
        // (Clean up any old unverified Customer record so uniqueness check passes)
        if ($customer && !$customer->is_verified) {
            $customer->tokens()->delete();
            $customer->delete();
        }

        // Always require OTP — consistent with regular email sign-up flow
        $otp = (string) random_int(100000, 999999);

        $pending = PendingRegistration::updateOrCreate(
            ['email' => $email],
            [
                'type'               => 'google',
                'name'               => $name,
                'password_encrypted' => null,
                'google_id'          => $googleId,
                'google_avatar'      => $avatar,
                'pending_token'      => Str::random(64),
                'otp'                => $otp,
                'otp_expires_at'     => now()->addMinutes(10),
                'email_verified'     => false,
                'expires_at'         => now()->addHours(24),
            ]
        );

        try {
            // Send email immediately with retry logic - won't block Google auth if email service fails
            $emailSent = $this->sendEmailWithRetry($email, $otp, $name);
            if ($emailSent) {
                Log::info('OTP email sent successfully for Google auth', ['email' => $email]);
            } else {
                Log::warning('OTP email failed to send after retries, but user can manually request resend', ['email' => $email]);
            }
        } catch (\Exception $e) {
            // Log error but don't fail Google auth - allow user to proceed with resend
            Log::error('Unexpected error sending OTP email for Google auth:', [
                'email' => $email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
        }

        return response()->json([
            'success'       => true,
            'is_login'      => false,
            'needs_otp'     => true,
            'pending_token' => $pending->pending_token,
            'email'         => $email,
            'message'       => 'Kode OTP telah dikirimkan ke email Anda.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 – Verify OTP
    // ─────────────────────────────────────────────────────────────────────────
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pending_token' => 'required|string',
            'otp'           => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $pending = PendingRegistration::where('pending_token', $request->pending_token)->first();

        if (!$pending) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi pendaftaran tidak ditemukan. Silakan ulangi pendaftaran.',
            ], 404);
        }

        if ($pending->expires_at->isPast()) {
            $pending->delete();
            return response()->json([
                'success' => false,
                'message' => 'Sesi pendaftaran sudah kadaluarsa. Silakan daftar ulang.',
            ], 410);
        }

        if (!$pending->otp || $pending->otp !== $request->otp) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP tidak valid.',
            ], 422);
        }

        if ($pending->otp_expires_at && $pending->otp_expires_at->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'Kode OTP sudah kadaluarsa. Minta kode baru.',
            ], 422);
        }

        $pending->update([
            'email_verified' => true,
            'otp'            => null,
            'otp_expires_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Email berhasil diverifikasi.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2b – Resend OTP
    // ─────────────────────────────────────────────────────────────────────────
    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pending_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $pending = PendingRegistration::where('pending_token', $request->pending_token)->first();

        if (!$pending) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi pendaftaran tidak ditemukan.',
            ], 404);
        }

        if ($pending->expires_at->isPast()) {
            $pending->delete();
            return response()->json([
                'success' => false,
                'message' => 'Sesi pendaftaran sudah kadaluarsa. Silakan daftar ulang.',
            ], 410);
        }

        $otp = (string) random_int(100000, 999999);
        $pending->update([
            'otp'           => $otp,
            'otp_expires_at' => now()->addMinutes(10),
        ]);

        try {
            // Send email immediately with retry logic - won't block OTP resend if email service fails
            $this->sendEmailWithRetry($pending->email, $otp, $pending->name);
        } catch (\Exception $e) {
            // Log error but don't fail OTP resend
            Log::warning('Failed to send OTP resend email:', [
                'email' => $pending->email,
                'error' => $e->getMessage(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kode OTP baru telah dikirimkan.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3 – Complete registration: create Customer account + issue token
    // ─────────────────────────────────────────────────────────────────────────
    public function completeRegistration(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pending_token' => 'required|string',
            'phone'         => 'required|string|max:20',
            'address'       => 'required|string|max:500',
            'address_label' => 'nullable|string|max:100',
            'address_notes' => 'nullable|string|max:300',
            'latitude'      => 'required|numeric',
            'longitude'     => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $pending = PendingRegistration::where('pending_token', $request->pending_token)->first();

        if (!$pending) {
            return response()->json([
                'success' => false,
                'message' => 'Sesi pendaftaran tidak ditemukan. Silakan daftar ulang.',
            ], 404);
        }

        if ($pending->expires_at->isPast()) {
            $pending->delete();
            return response()->json([
                'success' => false,
                'message' => 'Sesi pendaftaran sudah kadaluarsa. Silakan daftar ulang.',
            ], 410);
        }

        if (!$pending->email_verified) {
            return response()->json([
                'success' => false,
                'message' => 'Email belum diverifikasi. Silakan masukkan kode OTP terlebih dahulu.',
            ], 403);
        }

        // Check if a customer with this email already exists (edge case: duplicate submit)
        if (Customer::where('email', $pending->email)->exists()) {
            $pending->delete();
            return response()->json([
                'success' => false,
                'message' => 'Akun dengan email ini sudah ada. Silakan login.',
            ], 409);
        }

        // Determine plain-text password
        if ($pending->type === 'email' && $pending->password_encrypted) {
            // Crypt::decryptString returns the plain text we encrypted earlier.
            // Customer model has 'password' => 'hashed' cast, so it will hash it automatically.
            $plainPassword = Crypt::decryptString($pending->password_encrypted);
        } else {
            // Google users get a random password (they sign in via OAuth)
            $plainPassword = Str::random(32);
        }

        $customer = Customer::create([
            'name'          => $pending->name,
            'email'         => $pending->email,
            'password'      => $plainPassword,
            'google_id'     => $pending->google_id,
            'avatar'        => $pending->google_avatar,
            'phone'         => $request->phone,
            'address'       => $request->address,
            'address_label' => $request->address_label ?? '',
            'address_notes' => $request->address_notes ?? '',
            'latitude'      => $request->latitude,
            'longitude'     => $request->longitude,
            'is_verified'   => true,
        ]);

        // Mark email as verified in Laravel's built-in system
        $customer->markEmailAsVerified();

        // Issue Sanctum token
        $token = $customer->createToken('auth-token')->plainTextToken;

        // Remove the pending row
        $pending->delete();

        return response()->json([
            'success' => true,
            'message' => 'Akun berhasil dibuat. Selamat datang di Warung Edin! 🎉',
            'data'    => [
                'customer'   => $customer,
                'token'      => $token,
                'token_type' => 'Bearer',
            ],
        ], 201);
    }

    /**
     * Send email with retry logic (3 attempts WITHOUT blocking delays)
     * Returns early without waiting for all retries
     */
    private function sendEmailWithRetry($email, $otp, $name, $maxRetries = 3)
    {
        $lastException = null;
        
        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                Mail::to($email)->send(new OtpVerificationMail($otp, $name));
                Log::info("Email sent successfully to {$email} on attempt {$attempt}");
                return true;
            } catch (\Exception $e) {
                $lastException = $e;
                Log::warning("Email send failed (attempt {$attempt}/{$maxRetries})", [
                    'email' => $email,
                    'error_code' => get_class($e),
                    'error' => $e->getMessage(),
                ]);
                
                // Don't sleep/wait between retries - continue immediately
                // This prevents request timeout during email retries
            }
        }
        
        // All retries failed - log but don't throw (allow user to proceed with OTP)
        Log::error("Failed to send email after {$maxRetries} attempts", [
            'email' => $email,
            'error' => $lastException?->getMessage(),
        ]);
        
        // Return false but don't throw - user can request OTP resend
        return false;
    }
}
