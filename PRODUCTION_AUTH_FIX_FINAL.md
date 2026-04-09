# Production Authentication Fix - Final Steps

## Issue Summary
Registration, Login, dan Google Login gagal di production karena **SMTP timeout** saat mengirim verification email.

**Error**: `Connection could not be established with host "ssl://smtp.gmail.com:465: Stream socket client Unable to connect`

---

## Root Cause
1. **Wrong MAIL_PORT** - Production menggunakan port 465 (SSL) padahal konfigurasi MAIL_SCHEME=tls seharusnya port 587
2. **Synchronous Email** - Email dikirim langsung di request, bukan via queue
3. **No Timeout Handling** - Tidak ada fallback jika email gagal terkirim

---

## Code Fixes Applied ✅
Semua sudah diimplementasikan:

### 1. Backend Email Queue (with Fallback)
- ✅ `AuthController::customerPreRegister()` - Queue email, fallback ke log
- ✅ `AuthController::customerGoogleLogin()` - Queue email, fallback ke log  
- ✅ `PendingRegistrationController::verifyOtp()` - Queue email, fallback ke log
- ✅ `Customer::sendEmailVerificationNotification()` - Queue dengan try-catch

### 2. CORS & OAuth Fixes
- ✅ Updated API CORS middleware untuk domain production (warung-edin)
- ✅ Frontend OAuth request now include `credentials: 'include'`

### 3. Import & Type Errors
- ✅ Customer.php - Fixed Log import usage
- ✅ Controllers - All Log types resolved

---

## Deployment Steps for Railway

### Step 1: Perbaiki Environment Variables
SSH ke Railway app atau update via Railway dashboard:

```bash
# Update .env di Railway dengan:
MAIL_MAILER=smtp
MAIL_SCHEME=tls           # ← TLS, not SSL
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587             # ← Port 587 untuk TLS, bukan 465
MAIL_USERNAME=warungedin@gmail.com
MAIL_PASSWORD=ytiyrvbnvrijgohh
MAIL_FROM_ADDRESS="warungedin@gmail.com"
MAIL_FROM_NAME="Warung Edin"

# Queue configuration
QUEUE_CONNECTION=sync     # ← Fallback ke synchronous jika worker tidak running
```

### Step 2: Restart App
```bash
# Via Railway:
# 1. Go to Settings → Restart Deployment
# 2. Atau push code baru ke repo

# Or via SSH (if available):
php artisan config:cache
php artisan route:cache
```

### Step 3: Test Registration
1. Buka frontend: `https://warung-edin-sandy.vercel.app`
2. Klik Sign Up
3. Isi form & submit
4. Check if registration succeeds (email verification sent async)

### Step 4: (Optional) Setup Queue Worker
Untuk production yang lebih robust, setup queue worker:

```bash
# Add di Procfile atau railway.toml:
queue_worker: php artisan queue:work --queue=default --timeout=60 --sleep=3 --tries=3
```

---

## Expected Behavior After Fix

### Registration Flow
```
1. User submit form → API pre-register returns 200 (success)
2. Email queued untuk background processing
3. User dibawa ke verify-email page
4. Email terkirim (via queue worker atau sync)
5. User dapat OTP → verify & buat account
```

### Email Sending
- **Ideal**: Queue worker processes emails asynchronously
- **Fallback**: If QUEUE_CONNECTION=sync, emails sent immediately but with better error handling
- **Last Resort**: Error logged, user dapat retry atau manual verify

---

## Troubleshooting

### Masih timeout setelah perubahan?
1. Verify MAIL_PORT=587 & MAIL_SCHEME=tls (bukan SSL/465)
2. Check app logs: `php artisan log:tail` atau Railway logs
3. Try dari local development first: `php artisan tinker`
   ```php
   $customer = \App\Models\Customer::first();
   $customer->sendEmailVerificationNotification();
   ```

### Email masih tidak terkirim?
1. Check Gmail app password di: https://myaccount.google.com/apppasswords
2. Pastikan 2FA enabled di Gmail account
3. Verify MAIL_USERNAME & MAIL_PASSWORD benar
4. Check logs di Railway untuk error details

### Queue backlog?
Jika menggunakan queue worker, monitor:
```bash
php artisan queue:failed  # Lihat failed jobs
php artisan queue:retry   # Retry failed jobs
```

---

## Files Modified
- ✅ `be/app/Http/Middleware/ApiCorsMiddleware.php` - Added production domains
- ✅ `fe/src/services/authService.ts` - Added credentials: include
- ✅ `be/app/Models/Customer.php` - Fixed Log imports
- ✅ `be/app/Http/Controllers/Api/AuthController.php` - Queue email with fallback
- ✅ `be/app/Http/Controllers/Api/PendingRegistrationController.php` - Queue email with fallback

---

## Production Checklist
- [ ] MAIL_PORT=587 di Railway .env
- [ ] MAIL_SCHEME=tls di Railway .env
- [ ] QUEUE_CONNECTION=sync atau database
- [ ] Test registration berhasil
- [ ] Test login berhasil
- [ ] Test Google login berhasil
- [ ] Check logs di Railway untuk warning/errors

---

**Status**: 🟢 Siap Deploy
**Next Step**: Update Railway .env & restart app
