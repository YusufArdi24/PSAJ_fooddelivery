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
            $mailDriver = config('mail.default');
            
            // Detailed config logging
            $config = [
                'mail_driver' => $mailDriver,
                'mail_from_address' => config('mail.from.address'),
                'mail_from_name' => config('mail.from.name'),
            ];

            // Add driver-specific config
            if ($mailDriver === 'resend') {
                $config['resend_api_key_set'] = !empty(env('RESEND_API_KEY'));
                $config['note'] = 'Using Resend cloud email API (HTTP-based, no SMTP)';
            } else if ($mailDriver === 'smtp') {
                $config['mail_host'] = config('mail.mailers.smtp.host');
                $config['mail_port'] = config('mail.mailers.smtp.port');
                $config['mail_scheme'] = config('mail.mailers.smtp.scheme');
                $config['mail_timeout'] = config('mail.mailers.smtp.timeout');
                $config['mail_username'] = config('mail.mailers.smtp.username');
            }
            
            $config['queue_driver'] = config('queue.default');
            
            Log::info("Testing OTP email send - Full Config", $config);
            
            // Send test OTP email
            \Illuminate\Support\Facades\Mail::to($email)->send(
                new \App\Mail\OtpVerificationMail($otp, $name)
            );
            
            return response()->json([
                'success' => true,
                'message' => "OTP test email sent to {$email}",
                'config' => $config,
                'note' => $mailDriver === 'resend' 
                    ? 'Check email inbox for test message from Resend'
                    : 'If email doesn\'t arrive, check: 1) MAIL_FROM_ADDRESS validity, 2) Gmail spam folder, 3) Gmail app password, 4) 2FA enabled'
            ]);
            
        } catch (\Exception $e) {
            $mailDriver = config('mail.default');
            $errorConfig = [
                'mail_driver' => $mailDriver,
                'mail_from_address' => config('mail.from.address'),
                'mail_from_name' => config('mail.from.name'),
            ];

            if ($mailDriver === 'resend') {
                $errorConfig['resend_api_key_set'] = !empty(env('RESEND_API_KEY'));
                $errorConfig['note'] = 'RESEND_API_KEY must be set in Railway environment variables at https://railway.app - Settings → Variables';
            } else if ($mailDriver === 'smtp') {
                $errorConfig['mail_host'] = config('mail.mailers.smtp.host');
                $errorConfig['mail_port'] = config('mail.mailers.smtp.port');
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to send OTP test email',
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'troubleshooting' => $mailDriver === 'resend' 
                    ? [
                        'requirement' => 'RESEND_API_KEY environment variable must be set',
                        'setup_url' => 'https://resend.com/api-keys',
                        'railway_url' => 'https://railway.app - Settings → Variables',
                        'test_from_address' => 'onboarding@resend.dev (pre-verified for testing)'
                    ]
                    : [],
                'config' => $errorConfig,
            ], 500);
        }
    }
}