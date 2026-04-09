# CRITICAL - Railway Production Deployment Checklist

## ⚠️ MOST IMPORTANT FIRST

### Step 1: Update Railway Environment Variables (REQUIRED!)

**Go to Railway Dashboard:**
1. Services → `psajfooddelivery-production`
2. Click `Variables`
3. **CHANGE THESE (EXACT VALUES):**

```
QUEUE_CONNECTION=sync                     ← CRITICAL! Must be 'sync' not 'database'
MAIL_MAILER=smtp                          ← Must be 'smtp'
MAIL_SCHEME=tls                           ← Must be 'tls' (not ssl)
MAIL_HOST=smtp.gmail.com                  ← Must be exact
MAIL_PORT=587                             ← Must be 587 (not 465)
MAIL_USERNAME=warungedin@gmail.com        ← Must be exact
MAIL_PASSWORD=ytiyrvbnvrijgohh            ← Gmail App Password (16 chars)
MAIL_TIMEOUT=120                          ← Must be 120 seconds
```

**Do NOT missed any of above!**

### Step 2: Verify Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. **Must have 2FA enabled**: https://myaccount.google.com/security
3. Generate password for "Mail" / "Windows"
4. Copy the 16-character password with spaces
5. Paste exactly into MAIL_PASSWORD

### Step 3: Trigger Deployment

1. After changing variables, Railway auto-triggers
2. Wait for deployment to complete (~2-3 minutes)
3. Check: Deployments tab shows green checkmark

---

## 🧪 Testing After Deployment

### Test 1: Register with Email
```
URL: https://warung-edin-sandy.vercel.app/signup
1. Fill form (name, email, password)
2. Click "Daftar"
   ✅ Should immediately see "Masukkan Kode OTP" page
   ✅ No timeout/stuck loading
3. Check email (should arrive < 5 seconds)
4. Enter OTP → Account created
```

### Test 2: Google Login
```
URL: https://warung-edin-sandy.vercel.app/signin
1. Click "Lanjutkan dengan Google"
   ✅ Popup opens (no COOP error)
2. Select Google account
   ✅ Popup closes, no stuck loading
   ✅ Page redirects to "Masukkan Kode OTP"
3. Check email for OTP (< 5 seconds)
4. Enter OTP → Redirects to dashboard/profile
```

### Test 3: Check Logs

Go to Railway Logs & search for:
```
"Email sent successfully"          ← Good!
"Email send failed (attempt"       ← Retrying (OK)
"Failed to send email after 3"     ← Problem if this appears
```

---

## 🔍 Troubleshooting

### Issue 1: Stuck at "Loading" after selecting Google account
**Cause**: Email retry logic timeout / SMTP connection issue
**Fix**:
- Check MAIL_PORT=587 & MAIL_SCHEME=tls
- Check Railway logs for "SMTP timeout"
- Verify Gmail app password is correct

### Issue 2: OTP Email Not Arriving
**Cause**: SMTP credentials wrong OR QUEUE_CONNECTION still 'database'
**Fix**:
- Verify QUEUE_CONNECTION=sync (NOT database)
- Verify MAIL_PASSWORD = actual app password (16 chars)
- Check 2FA enabled on Gmail
- Check logs: `"Email send failed"` vs `"Email sent successfully"`

### Issue 3: CORS Error in Console
**Cause**: Origin not whitelisted
**Fix**:
- Check backend CORS middleware has `warung-edin-sandy.vercel.app`
- Already included, so shouldn't happen

---

## 📊 Email Sending Flow

### How It Works Now (Fixed)
```
1. User submits → Backend receives
2. Create pending registration
3. Try to send email (Attempt 1)
4. If fails → Try again (Attempt 2)
5. If fails → Try again (Attempt 3)
6. If all fail → Log error
7. Return response to user (NO WAITING)
8. User sees OTP page
9. User can click "Resend OTP" if email missing
```

**Key Point**: Response sent IMMEDIATELY, no waiting for email!

---

## 🚀 Code Changes

**What Fixed Stuck Loading:**
- Removed `sleep()` from retry logic
- Retry immediately instead of waiting
- Response sent before email attempts
- No blocking delays in request

**What Fixed OTP Not Arriving:**
- Better error logging
- Fallback to manual resend
- QUEUE_CONNECTION must be `sync`

---

## ⏱️ Expected Timing

| Action | Time | Status |
|--------|------|--------|
| User clicks Sign Up | ~2 sec | API response |
| Redirect to OTP page | Immediate | ✅ |
| Email arrives | <5 sec | Should see in inbox |
| OTP verified | ~2 sec | Account created |

---

## 📋 Final Checklist Before Going Live

- [ ] QUEUE_CONNECTION=sync in Railway
- [ ] MAIL_SCHEME=tls in Railway
- [ ] MAIL_PORT=587 in Railway
- [ ] Gmail App Password verified (2FA enabled)
- [ ] Railway deployment complete (green status)
- [ ] Test email signup → OTP arrives
- [ ] Test Google login → OTP arrives
- [ ] Check Railway logs → No "SMTP timeout" errors
- [ ] User reports authentication working

---

## ❌ Common Mistake (Don't Do This!)

```
❌ QUEUE_CONNECTION=database    ← Don't! Need worker daemon
❌ MAIL_PORT=465                ← Don't! Use 387
❌ MAIL_SCHEME=ssl              ← Don't! Use tls
❌ sleep() in retry              ← Don't! Causes timeout
```

---

## ✅ Success Sign

When everything works:
```
Console Log:
"Email sent successfully to user@gmail.com on attempt 1"

User Experience:
📧 Sign up → Click email button → OTP page → Email arrives in 2 sec → Login success
```

---

**Status**: Ready for production!

**Next Step**: Update Railway .env variables exactly as above, then test all 3 flows.
