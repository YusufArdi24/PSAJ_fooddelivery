<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Admin;
use Illuminate\Support\Facades\Log;

class TestEmailController extends Controller
{
    /**
     * Test sending customer verification email
     */
    public function testCustomerEmail(Request $request)
    {
        try {
            $customer = Customer::where('email_verified_at', null)->first();
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'No unverified customer found'
                ]);
            }
            
            $customer->sendEmailVerificationNotification();
            
            return response()->json([
                'success' => true,
                'message' => 'Verification email sent to: ' . $customer->email
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ]);
        }
    }
    
    /**
     * Test sending admin verification email
     */
    public function testAdminEmail(Request $request)
    {
        try {
            $admin = Admin::where('email_verified_at', null)->first();
            
            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'No unverified admin found'
                ]);
            }
            
            $admin->sendEmailVerificationNotification();
            
            return response()->json([
                'success' => true,
                'message' => 'Verification email sent to: ' . $admin->email
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Test sending OTP email directly
     * Usage: GET /api/v1/test/otp?email=test@gmail.com
     */
    public function testOtpEmail(Request $request)
    {
        try {
            $email = $request->query('email', 'test@example.com');
            $otp = '123456';
            $name = 'Test User';
            
            // Detailed config logging
            $config = [
                'mail_mailer' => config('mail.default'),
                'mail_host' => config('mail.mailers.smtp.host'),
                'mail_port' => config('mail.mailers.smtp.port'),
                'mail_scheme' => config('mail.mailers.smtp.scheme'),
                'mail_timeout' => config('mail.mailers.smtp.timeout'),
                'mail_from_address' => config('mail.from.address'),
                'mail_from_name' => config('mail.from.name'),
                'mail_username' => config('mail.mailers.smtp.username'),
                'mail_encryption' => config('mail.mailers.smtp.scheme'),
                'queue_driver' => config('queue.default'),
            ];
            
            Log::info("Testing OTP email send - Full Config", $config);
            
            // Send test OTP email
            \Illuminate\Support\Facades\Mail::to($email)->send(
                new \App\Mail\OtpVerificationMail($otp, $name)
            );
            
            return response()->json([
                'success' => true,
                'message' => "OTP test email sent to {$email}",
                'config' => $config,
                'note' => 'If email doesn\'t arrive, check: 1) MAIL_FROM_ADDRESS validity, 2) Gmail spam folder, 3) Gmail app password, 4) 2FA enabled'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP test email',
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'config' => [
                    'mail_mailer' => config('mail.default'),
                    'mail_host' => config('mail.mailers.smtp.host'),
                    'mail_port' => config('mail.mailers.smtp.port'),
                    'mail_scheme' => config('mail.mailers.smtp.scheme'),
                    'mail_from_address' => config('mail.from.address'),
                    'mail_from_name' => config('mail.from.name'),
                    'mail_username' => config('mail.mailers.smtp.username'),
                    'queue_driver' => config('queue.default'),
                ]
            ], 500);
        }
    }
}