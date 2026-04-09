# OTP Email Delivery Fix - Production Guide

## Problem
OTP emails tidak terkirim ke Gmail saat user register/Google login, padahal system berhasil redirect ke OTP verify page.

**Root Cause**: 
- Backend setup dengan `QUEUE_CONNECTION=database`
- Email disimpan ke jobs table tapi perlu `queue:work` daemon untuk memproses
- Railway tidak punya queue worker running, email stuck di queue database

---

## Solution Implemented ✅

### 1. Changed Email Sending Strategy
- **From**: `Mail::queue()` (async via database queue)
- **To**: `Mail::send()` with retry logic (immediate sending)

**Benefits:**
- ✅ Email sent immediately, no queue worker needed
- ✅ Automatic retry 3x dengan exponential backoff
- ✅ Fallback error handling, tidak block user registration

### 2. Added Retry Logic
```php
sendEmailWithRetry($email, $otp, $name);
// Retries: 1s, 2s, 4s delays between attempts
```

### 3. Updated Queue Configuration
- `QUEUE_CONNECTION=sync` (tidak queue di database)
- Langsung process jobs synchronously

---

## Production Deployment Steps

### Step 1: Update Railway Environment Variables

**SSH ke Railway atau update via Dashboard:**

```env
# CRITICAL: Change these:
QUEUE_CONNECTION=sync              # ← Change from 'database'
MAIL_PORT=587                      # ← Must be 587 (not 465)
MAIL_SCHEME=tls                    # ← Must be tls (not ssl)
MAIL_MAILER=failover               # ← Already correct (smtp + log fallback)
MAIL_TIMEOUT=120                   # ← Already correct

# Verify these are set:
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=warungedin@gmail.com
MAIL_PASSWORD=ytiyrvbnvrijgohh    # ← Gmail app password
```

**⚠️ CRITICAL: Gmail Setup**
1. Go to: https://myaccount.google.com/apppasswords
2. Generate app password for "Mail" / "Windows"
3. Copy password to MAIL_PASSWORD
4. **Must have 2FA enabled** on Gmail

### Step 2: Deploy Code

```bash
git add .
git commit -m "Fix: Email delivery - change from queue to immediate send with retry logic"
git push origin main
```

Railway will auto-restart (~2-3 minutes)

### Step 3: Verify in Production

**Test Sign Up:**
```
URL: https://warung-edin-sandy.vercel.app/signup
1. Fill form (name, email, password)
2. Click Sign Up
3. ✅ Should redirect to "Masukkan Kode OTP"
4. ✅ Check email - OTP should arrive within 5 seconds
5. Enter OTP → Account created
```

**Test Google Login:**
```
URL: https://warung-edin-sandy.vercel.app/signin
1. Click "Lanjutkan dengan Google"
2. Select Google account
3. ✅ Should redirect to "Masukkan Kode OTP"
4. ✅ Check email - OTP should arrive within 5 seconds
```

---

## Email Flow Diagram

### Before (Broken)
```
User Submit
  ↓
Backend: Mail::queue() → Save to jobs table
  ↓
Waiting for queue:work daemon... (NOT RUNNING ON RAILWAY)
  ↓
❌ Email stuck, never delivered
```

### After (Fixed)
```
User Submit
  ↓
Backend: Mail::send()
  ↓
Try SMTP connection (3 retries with backoff)
  ↓
✅ Email delivered OR logged as error
  ↓
✅ User continues (no blocking)
```

---

## Error Handling

### Email Sent Successfully
```json
{
  "success": true,
  "is_login": false,
  "pending_token": "xxx",
  "email": "user@example.com",
  "message": "Kode OTP telah dikirimkan ke email Anda."
}
```
✅ User can view OTP page and wait for email

### Email Failed But Registration Proceeds
```
Log: "Failed to send email after 3 attempts: SMTP timeout"
```
- ✅ User still gets `pending_token` and redirect
- ✅ Can retry "Kirim Ulang OTP" button
- ⚠️ Manual verification available if needed

---

## Logs to Monitor

### Check Railway Logs
```
Dashboard → Services → psajfooddelivery-production → Logs
```

**Success logs:**
```
"Email sent successfully to user@gmail.com on attempt 1"
```

**Warning logs (should retry):**
```
"Email send failed (attempt 1/3): Connection timeout"
"Email sent successfully to user@gmail.com on attempt 2"
```

**Error logs (need investigation):**
```
"Failed to send email after 3 attempts: Invalid credentials"
```

---

## Troubleshooting

### OTP Email Still Not Arriving?

**1. Check Gmail Credentials**
```
In Railway .env:
MAIL_USERNAME=warungedin@gmail.com
MAIL_PASSWORD=xxxx xxxx xxxx xxxx  ← App password (16 chars + spaces)
```

**2. Check 2FA Enabled**
```
https://myaccount.google.com/security
→ 2-Step Verification: Should be ON
```

**3. Check MAIL_PORT**
```
In Railway .env:
MAIL_PORT=587  ← NOT 465!
MAIL_SCHEME=tls  ← NOT ssl!
```

**4. Check Railway Logs for Errors**
```
"Connection could not be established"
  → Check port/host/credentials
  
"Authentication failed"
  → Check Gmail app password is correct
  
"Timeout"
  → Increase MAIL_TIMEOUT in .env (already set to 120)
```

**5. Manual Test (via Railway Shell)**
```
$ php artisan tinker

>>> use Illuminate\Support\Facades\Mail;
>>> Mail::to('test@gmail.com')->send(new App\Mail\OtpVerificationMail('123456', 'Test'));
```

---

## Performance Impact

- ✅ **No degradation** - Email sent immediately (no queue delay)
- ✅ **Better reliability** - 3 retry attempts with backoff
- ✅ **Graceful failures** - Non-blocking, logs errors
- ⚠️ **Slight delay if retrying** - Max 7 seconds (1+2+4s backoff)

---

## Files Modified

```
be/app/Http/Controllers/Api/PendingRegistrationController.php
  - preRegister() → use sendEmailWithRetry()
  - googleAuth() → use sendEmailWithRetry()
  - resendOtp() → use sendEmailWithRetry()
  - NEW: sendEmailWithRetry() method with 3x retry + backoff

be/.env.example
  - QUEUE_CONNECTION=database → QUEUE_CONNECTION=sync
```

---

## Production Checklist

- [ ] QUEUE_CONNECTION=sync in Railway .env
- [ ] MAIL_PORT=587 in Railway .env
- [ ] MAIL_SCHEME=tls in Railway .env
- [ ] Gmail app password set (2FA enabled)
- [ ] Restart Railway deployment
- [ ] Test sign up → OTP received in <5 seconds
- [ ] Test Google login → OTP received in <5 seconds
- [ ] Check Railway logs for no SMTP errors
- [ ] Verify user can complete registration with OTP

---

**Status**: 🟢 Ready for deployment

**Next**: Push to main, wait for Railway auto-restart, test OTP email delivery
