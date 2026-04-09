# Midtrans Payment Issues - Complete Troubleshooting Guide

## Problem 1: "No payment channels available"
```
No payment channels available
Please contact Warung Edin to discuss payment procedure.
```

**Cause**: Payment methods tidak ter-load di Snap.js, biasanya karena:
1. CORS origin tidak ter-whitelist (snap.js tidak bisa komunikasi)
2. Payment methods belum diaktifkan
3. Client key tidak valid / sudah expire

---

## Solution: CORS Origin Whitelist (CRITICAL)

### ✅ Step 1: Payment Methods Activation (Already IN PROGRESS)

Anda sudah lihat di dashboard:
```
✅ "We're currently processing your activation request for BNI, CIMB Niaga, 
PermataBank, BRI, GoPay Dynamic QRIS, BSI, GoPay, and Bank Mandiri."
```

**Artinya:**
- ✅ Request sudah diterima Midtrans
- ⏳ Sedang dalam proses review (24-48 jam)
- 🎯 Setelah approve, payment methods akan active otomatis

**JANGAN TUNGGU** - Lanjut ke Step 2 (CORS whitelist) sambil payment methods sedang diproses.

---

### ✅ Step 2: CORS Whitelist - Contact Midtrans Support (REQUIRED)

Karena setting CORS Origins **TIDAK ADA** di UI dashboard Midtrans terbaru, Anda harus:

**Email ke: support@midtrans.com**

**Subject:**
```
Whitelist CORS Origins for Snap.js - Sandbox/Production
```

**Body:**
```
Hello,

I'm implementing Midtrans Snap.js payment gateway on my web application.
Currently, when customers try to open payment modal, they get:
"No payment channels available" or snap.js fails to load.

Could you please whitelist these CORS origins for my account:

Sandbox Account (if applicable):
- https://warung-edin-sandy.vercel.app
- http://localhost:5173
- http://127.0.0.1:5173

For Authentication, here are my keys:
- Server Key: Mid-server-[PREFIX-ONLY] (for verification)
- Merchant ID: [Your Merchant ID if known]

Please confirm once CORS is whitelisted. Thank you.

Best regards,
[Your Name]
```

**Expected Response Time**: 1-2 hours to 1 business day

---

### Step 3: While Waiting - Verify Backend Setup

### 3a. Test Backend Endpoint

```bash
# Test yang payment methods endpoint berfungsi
curl -X GET https://psajfooddelivery-production.up.railway.app/api/v1/payment-methods
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "key": "gopay",
      "name": "GoPay",
      "use_midtrans": true,
      ...
    }
  ],
  "midtrans": {
    "client_key": "Mid-client-xxx",
    "snap_url": "https://app.sandbox.midtrans.com/snap/snap.js"
  }
}
```

Jika error/404 → Backend mungkin tidak berjalan

### 3b. Check Backend Logs

```bash
# Railway logs
# Go to: https://railway.app/project/[YOUR_PROJECT_ID]
# Click "Logs" tab
# Look for recent deployments and errors
```

### 3c. Verify Client Key Valid

Di `.env` backend pastikan:
```bash
MIDTRANS_IS_PRODUCTION=false  # For sandbox testing
MIDTRANS_CLIENT_KEY=Mid-client-xxxx  # This should match the one in dashboard
```

**Generate new keys if needed:**
- Sandbox: https://dashboard.sandbox.midtrans.com/settings/config
- Production: https://dashboard.midtrans.com/settings/config

---

### Step 4: Temporary Workaround (While waiting for CORS whitelist)

Jika ingin test payment flow sambil menunggu Midtrans reply, coba:

**Option A: Test di localhost**
```bash
# Frontend
cd fe
npm run dev
# Akan berjalan di http://localhost:5173

# Buka: http://localhost:5173
# (localhost SUDAH ter-whitelist otomatis di Midtrans Sandbox)
```

**Option B: Enable CORS di Backend**

Edit `be/app/Http/Middleware/HandleCors.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class HandleCors
{
    public function handle(Request $request, Closure $next)
    {
        $allowedOrigins = [
            'https://warung-edin-sandy.vercel.app',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
        ];

        $origin = $request->header('Origin');
        if (in_array($origin, $allowedOrigins)) {
            return $next($request)
                ->header('Access-Control-Allow-Origin', $origin)
                ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
                ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
                ->header('Access-Control-Allow-Credentials', 'true');
        }

        return $next($request);
    }
}
```

---

## Complete URL Endpoints Setup (Already Done)

---

### For Production Deployment

Ganti URLs di atas dengan domain production Anda:

```
# Production Backend Domain (Railway):
https://[YOUR-RAILWAY-BACKEND-DOMAIN]/api/v1/payment/notification

# Production Frontend Domain (Vercel):
https://[YOUR-VERCEL-FRONTEND-DOMAIN]/payment/finish
```

Check di:
- Railway dashboard → domain backend
- Vercel dashboard → domain frontend

### 2. OPTIONAL: Improve Frontend Error Handling

Update `/fe/src/services/paymentService.ts` untuk lebih robust:

```typescript
// Add proper error handling untuk snap.js loading
export const initializeMidtransSnap = async (snapUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if snap already loaded
    if ((window as any).snap) {
      console.log("Snap already initialized");
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = snapUrl;
    script.async = true;
    script.type = "text/javascript";
    
    // Add more detailed error handling
    script.onload = () => {
      console.log("Snap.js loaded successfully");
      
      // Verify snap object is available
      if (!(window as any).snap) {
        reject(new Error("Snap object not found after loading script"));
        return;
      }
      
      // Configure snap if production
      if ((window as any).snap.setClientKey) {
        // Some versions support this
      }
      
      resolve();
    };
    
    script.onerror = () => {
      console.error("Failed to load Snap.js from:", snapUrl);
      reject(new Error(`Failed to load Snap.js from ${snapUrl}`));
    };

    // Handle timeout
    const timeout = setTimeout(() => {
      console.error("Snap.js loading timeout");
      reject(new Error("Snap.js loading timeout"));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      console.log("Snap.js loaded successfully");
      if (!(window as any).snap) {
        reject(new Error("Snap object not found"));
        return;
      }
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeout);
      console.error("Failed to load Snap.js");
      reject(new Error("Failed to load Snap.js"));
    };

    document.head.appendChild(script);
  });
};
```

## Endpoint Explanation

### Notification URLs (Backend)
```
https://psajfooddelivery-production.up.railway.app/api/v1/payment/notification
```
- Digunakan untuk **webhook** dari Midtrans (server-to-server)
- Midtrans akan POST payment status update ke endpoint ini
- Backend akan:
  1. Verify signature dari Midtrans
  2. Update Payment record di database
  3. Send email confirmation ke customer
  4. Update order status

**Request dari Midtrans akan berisi:**
```json
{
  "transaction_id": "...",
  "order_id": "ORDER-123-1712234567",
  "payment_type": "gopay",
  "transaction_status": "settlement",
  "fraud_status": "accept"
}
```

### Redirect URLs (Frontend)
- **Finish**: Customer berhasil bayar → redirect ke halaman konfirmasi sukses
- **Unfinish**: Customer klik "Back to Order" sebelum bayar → halaman pending
- **Error**: Payment gagal → halaman error dengan opsi retry

---

## Test Checklist

- [ ] 3 Notification URLs sudah di-set ke backend endpoint
- [ ] 3 Redirect URLs sudah di-set ke frontend pages
- [ ] Klik **Save** di Midtrans dashboard
- [ ] Tunggu 5-10 menit untuk propagasi
- [ ] Refresh browser (Ctrl+Shift+R)
- [ ] Payment methods AKTIF di Midtrans dashboard
- [ ] Test payment flow dari awal
- [ ] Check email - customer harus terima confirmation
- [ ] Cek backend logs - webhook harus tercatat

---

## Quick Debug: Test Snap.pay di Console

**Step 1: Buka frontend (vercel atau localhost)**

**Step 2: Buka DevTools (F12) → Console tab**

**Step 3: Jalankan test ini:**

```javascript
// Check 1: Verify snap object loaded
console.log("Snap object:", window.snap);

// Check 2: Try to create a test transaction via API
fetch('https://psajfooddelivery-production.up.railway.app/api/v1/payment/snap/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN_HERE'
  },
  body: JSON.stringify({
    order_id: 999,  // Use existing order ID
    payment_method: 'gopay'
  })
})
.then(r => r.json())
.then(data => {
  console.log("Snap transaction created:", data);
  
  // If successful, try to open payment
  if (data.success && window.snap) {
    window.snap.pay(data.data.snap_token, {
      onSuccess: (result) => console.log("Success:", result),
      onError: (result) => console.log("Error:", result),
    });
  } else {
    console.error("Failed to create transaction or snap not loaded");
  }
})
.catch(err => console.error("Error:", err));
```

**Expected Output:**
- ✅ If snap.pay opens payment modal → Problem bukan di code, tapi di CORS whitelist
- ❌ If error "No payment channels" → Contact Midtrans support

---

## Troubleshooting

### URL Endpoints Not Found (404)
1. **Check Backend is Running**
   ```bash
   # Verify backend API is accessible
   curl https://psajfooddelivery-production.up.railway.app/api/v1/payment-methods
   ```
   Should return `200 OK` with payment methods

2. **Check Endpoint Path**
   - Make sure path is exactly: `/api/v1/payment/notification`
   - Verify backend routes are configured

3. **Check Domain**
   - Must be full HTTPS URL
   - Must NOT have trailing slash

### Webhook Not Received
1. **Check Midtrans Logs**
   - Go to Midtrans Dashboard → Transactions
   - Click any transaction → View Details → Logs
   - Check if webhook was sent and response code

2. **Check Backend Logs**
   - Railway logs: Dashboard → Logs
   - Look for 404 or error entries
   - Backend should log webhook receipt

3. **Test Webhook Manually**
   ```bash
   curl -X POST https://psajfooddelivery-production.up.railway.app/api/v1/payment/notification \
     -H "Content-Type: application/json" \
     -d '{
       "transaction_id": "test-123",
       "order_id": "ORDER-123-1712234567",
       "transaction_status": "settlement"
     }'
   ```
   Should return `200 OK` response

### Payment Status Not Updating
1. Verify webhook endpoint returning 200 OK
2. Check database - Payment record should update
3. Verify email configuration (Resend API key)
4. Check backend logs for errors

### Problem 2: "Access denied due to unauthorized transaction" (HTTP 401)

```
Failed to create payment transaction: Midtrans API is returning API error. 
HTTP status code: 401
API response: ["error_messages":["Access denied due to unauthorized transaction, please check client or server key"]]
```

**This means keys TIDAK VALID atau tidak cocok.**

**Fix:**

1. **Verify Keys di Midtrans Dashboard**
   - Login ke: https://dashboard.sandbox.midtrans.com
   - Go to: SETTINGS → **ACCESS KEYS**
   - Copy EXACT keys (termasuk prefix `Mid-server-` dan `Mid-client-`)
   - Pastikan jangan ada space atau karakter extra

2. **Update `.env` backend**
   ```bash
   cd be
   # Edit .env di text editor atau gunakan:
   nano .env
   ```
   
   Pastikan ini EXACT match dengan dashboard:
   ```bash
   MIDTRANS_IS_PRODUCTION=false
   MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxxx
   MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxxx
   ```

3. **Test Keys**
   ```bash
   # Verify backend .env loaded correctly
   php artisan config:cache
   php artisan config:clear
   ```

4. **Restart Backend**
   - Railway: Deploy baru
   - Localhost: Restart dev server

5. **Test Transaction Again**
   - Buka frontend
   - Try payment flow
   - Cek error di console

**If masih error:**
- Email Midtrans: `support@midtrans.com`
- Subject: `401 Unauthorized - Invalid Server/Client Key`
- Body: Include error message dan verify keys di dashboard

---

### Still Getting "No payment channels available"

**This means CORS whitelist is the issue. Do this now:**

1. **Test di localhost first (workaround)**
   ```bash
   npm run dev  # Frontend at http://localhost:5173
   ```
   - Coba payment flow di localhost
   - Jika berhasil → Confirmed CORS issue
   - Jika masih gagal → Mungkin payment methods tidak diaktifkan

2. **Contact Midtrans Support IMMEDIATELY**
   - Email saya sudah di atas (Step 2)
   - Mereka akan whitelist domain Anda untuk snap.js komunikasi
   - Biasanya 1-2 jam sudah diproses

3. **Saat menunggu reply Midtrans:**
   - Gunakan localhost untuk development
   - Cek apakah payment methods aktif
   - Verify backend dan client keys benar-benar match

### Customer Still Getting postMessage Error
1. This is separate from URL Endpoints issue
2. Related to CORS/Origin validation by Midtrans
3. Sama - Contact Midtrans support untuk whitelist
4. Try clearing browser cache completely

## Environment Variable Check

Ensure backend `.env` sudah tepat:

```bash
# For production
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_CLIENT_KEY=Mid-client-PRODUCTION-KEY

# For sandbox (testing)
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_CLIENT_KEY=Mid-client-SANDBOX-KEY
```

## Additional Notes

- **Midtrans snap.js loads from CDN** - tidak bisa self-hosted (security reason)
- **Origin check adalah security feature** - melindungi dari unauthorized usage
- **Propagation delay** - perubahan di dashboard butuh waktu 5-10 menit
- **Multiple origins supported** - boleh add localhost + production sekaligus
