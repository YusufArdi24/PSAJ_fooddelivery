<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Admin;

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
}