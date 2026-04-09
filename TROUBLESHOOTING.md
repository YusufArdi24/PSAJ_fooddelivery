# 🔧 Deployment Troubleshooting Guide

## 🚨 Common Issues & Fixes

---

## 1️⃣ API Response 404 or Empty

### Symptom
- Frontend loads but shows "Failed to load menus"
- Browser console: `404 Not Found` or `CORS error`

### Causes & Solutions

**A. Wrong API URL**
```bash
# Fix in Vercel Environment Variables:
VITE_API_BASE_URL=https://your-railway-url.railway.app/api/v1

# ⚠️ Common mistakes:
# ❌ Missing /api/v1 suffix
# ❌ Using localhost instead of Railway URL
# ❌ Extra slashes: https://url//api/v1
```

**B. Backend API not running**
```bash
# Check in Railway Dashboard:
1. Go to Deployments tab
2. Look for green checkmark ✅ (deployed)
3. If showing ❌, click to view logs and debug

# Test with curl:
curl https://your-railway-url.railway.app/api/v1/menus -v
# Should return JSON array, not 404
```

**C. CORS not configured**
```bash
# In Railway, verify FRONTEND_URL:
FRONTEND_URL=https://your-vercel-url.vercel.app

# Note: Must match EXACTLY
# ❌ http:// instead of https://
# ❌ Missing .vercel.app
# ❌ Extra trailing slash
```

---

## 2️⃣ CORS Error: Access blocked

### Symptom
```
Access to XMLHttpRequest at 'https://backend.railway.app/api/v1/menus'
from origin 'https://frontend.vercel.app' has been blocked by CORS policy
```

### Fix

**Step 1: Update Railway Variables**
```
FRONTEND_URL=https://your-frontend.vercel.app
```

**Step 2: Redeploy Backend**
- Railway Dashboard → Deployments → "Redeploy" button
- Wait for green checkmark

**Step 3: Clear Browser Cache**
- Chrome DevTools → Application → Clear storage
- Or use Incognito window (Ctrl+Shift+P)

**Step 4: Test Again**
- Open frontend in new tab
- Check browser console (F12)

---

## 3️⃣ Database Connection Error

### Symptom
```
SQLSTATE[HY000] [2002] Connection refused
```

Or application won't start in Railway.

### Fixes

**Check 1: Database Service exists**
```
Railway Dashboard → Services → Should see MySQL service
```

**Check 2: Database Credentials**

Verify in Railway Variables using Railway placeholders:

```
❌ WRONG:
DB_HOST=localhost
DB_PORT=3306

✅ RIGHT:
DB_HOST=${{ MYSQL_HOST }}
DB_PORT=${{ MYSQL_PORT }}
DB_USERNAME=${{ MYSQL_USER }}
DB_PASSWORD=${{ MYSQL_PASSWORD }}
DB_DATABASE=${{ MYSQL_DATABASE }}
```

These are Railway's placeholder variables - they auto-populate!

**Check 3: View Railway Logs**
```
Dashboard → Deployments → View Logs
Look for error messages
```

**Check 4: MySQL Service Running**
```
Dashboard → Services → MySQL → Check if running
If red X, click "Deploy" to restart
```

---

## 4️⃣ Email Not Sending (Registration verification)

### Symptom
- User registers but doesn't receive verification email
- Laravel logs show SMTP errors

### Fixes

**Check 1: Gmail App Password Setup**

Gmail requires special app password:

1. https://myaccount.google.com/apppasswords
2. Select "Mail" → "Windows PC" (or your OS)
3. Generate password (16 characters)
4. Copy & update Railway variables:

```
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=THE-16-CHAR-PASSWORD
```

5. No 2FA? Can't use app passwords. Options:
   - Enable 2FA at https://myaccount.google.com/security
   - Or use alternative SMTP (SendGrid, Mailgun)

**Check 2: Verify Gmail allows Less Secure Apps**

Some Gmail accounts need this:
- https://myaccount.google.com/u/0/security
- Find "Less secure app access" → Turn ON
- (App passwords better solution though)

**Check 3: Check Logs**

Railway Dashboard → Logs - search for "SMTP" or "Mail":

```
If you see:
❌ "Connection refused SMTP"
   → Check MAIL_HOST, MAIL_PORT values
   → Verify network connection

❌ "Authentication failed"
   → MAIL_USERNAME/PASSWORD incorrect
   → Or app password not generated properly
```

---

## 5️⃣ Payment Gateway (Midtrans) Not Working

### Symptom
- Checkout page appears but payment button doesn't work
- Dashboard shows error: "Midtrans transaction failed"

### Fixes

**Check 1: Midtrans Keys**

Verify in Railway variables:

```
MIDTRANS_SERVER_KEY=Mid-server-xxx
MIDTRANS_CLIENT_KEY=Mid-client-xxx
```

Get real keys from: https://dashboard.sandbox.midtrans.com/settings/config

**Check 2: Test vs Production Mode**

For sandbox testing (recommended):
```
MIDTRANS_IS_PRODUCTION=false
# Use sandbox.midtrans.com keys
```

For live transactions:
```
MIDTRANS_IS_PRODUCTION=true
# Use production keys & real credit cards
```

**Check 3: Check Midtrans Logs**

1. https://dashboard.sandbox.midtrans.com/transactions
2. Look for recent transactions
3. Click to see error details
4. Common errors:
   - "Invalid server key" → Check MIDTRANS_SERVER_KEY
   - "Invalid amount" → Check order total calcul
   - "Invalid items" → Check cart items

---

## 6️⃣ Frontend Build Fails on Vercel

### Symptom
```
Build FAILED
Command npm run build exited with 1
Error: Cannot find module '@...'
```

### Fixes

**Check 1: Dependencies**
```bash
# Locally test:
cd fe
rm node_modules package-lock.json
npm ci
npm run build

# Should complete without error
# If not, fix errors before pushing
```

**Check 2: TypeScript Errors**
```bash
# Check for TS errors:
cd fe
npm run lint
# Fix any errors shown

# Or run tsc check:
npx tsc --noEmit
```

**Check 3: Vite Config**

Check [fe/vite.config.ts](fe/vite.config.ts):
```typescript
// Make sure it has:
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
  },
  // ... other config
})
```

**Check 4: Environment Variables**

Vercel needs VITE_ prefix for React:

```
✅ VITE_API_BASE_URL
✅ VITE_GOOGLE_CLIENT_ID

❌ API_BASE_URL (won't be accessed)
❌ REACT_APP_API_URL (old React only)
```

---

## 7️⃣ "Cannot GET /" on Frontend

### Symptom
Visit https://your-vercel-url.vercel.app → Shows "Cannot GET /"

### Cause
Vercel rewrites missing. `vercel.json` not configured.

### Fix

Make sure [fe/vercel.json](fe/vercel.json) has this:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

Then redeploy on Vercel.

---

## 8️⃣ Backend Migrations Fail

### Symptom
Railway deployment fails with migration error:
```
SQLSTATE[42S02]: Table not found error
```

### Fixes

**Check 1: Procfile Configuration**

[be/Procfile](be/Procfile) should have:
```
web: vendor/bin/heroku-php-apache2 public/
release: php artisan migrate --force
```

**Check 2: Database Permissions**

Railway MySQL user might not have permissions. Try:

```bash
# In Railway environment variables, ensure:
DB_USERNAME=${{ MYSQL_USER }}
DB_PASSWORD=${{ MYSQL_PASSWORD }}
```

Railway creates these automatically.

**Check 3: Run Migration Manually**

In Railway Logs or via SSH:
```bash
php artisan migrate:fresh --force --seed
# This might require SSH access
```

---

## 9️⃣ Docker Build Failed: "Invalid URI"

### Symptom
```
In Request.php line 355:
Invalid URI.

ERROR: failed to build: failed to solve...
Script returned with error code 1
```

Terjadi saat Railway docker build dengan composer install.

### Causes
- `APP_URL` invalid atau placeholder saat docker build
- Composer menjalankan `artisan package:discover` yang membutuhkan APP_URL valid
- Railway env variables belum ter-load saat build time

### Fix

**Understanding the Process:**

```
.env.example:
  APP_URL=http://localhost:8000
  ↓ (digunakan saat Docker build)
  
Docker Build (Dockerfile):
  composer install ← APP_URL harus valid saat ini
  ↓
  
Railway Runtime Variables (override):
  APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}} ← app akan gunakan ini saat live
```

**Step 1: Verify .env.example**

Check APP_URL harus nilai valid (bukan placeholder):
```
APP_URL=http://localhost:8000  ✅ Valid untuk build
```

❌ Jangan:
```
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}  ❌ Placeholder tidak valid saat build
```

**Step 2: Railway Variables should override**

Di Railway Dashboard → GitHub Repo Service → Variables:

```
APP_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}
```

Railway placeholder ini akan auto-resolve saat runtime ✅

**Step 3: Redeploy**

```bash
git commit & push → Railway redeploy dengan .env.example yang benar
```

---

### 1. Check Logs Everywhere

**Frontend (Vercel):**
- https://vercel.com/dashboard
- Select project → Deployments → Latest → Logs tab

**Backend (Railway):**
- https://railway.app/dashboard
- Select project → Deployments → View Logs

**Browser Console (F12):**
- Network tab → See API requests
- Console tab → See JS errors
- Application → Local storage / Cookies

### 2. Test API Directly

```bash
# From anywhere (terminal, curl, Postman):

# Get menus
curl https://your-railway.railway.app/api/v1/menus

# Register
curl -X POST https://your-railway.railway.app/api/v1/customers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "password_confirmation": "password123"
  }'
```

### 3. Check Environment Variables

**Railway:**
```
Dashboard → Variables section
Make sure ALL required vars are set
Check for typos
```

**Vercel:**
```
Project Settings → Environment Variables
Make sure VITE_ variables are set
Settings → Domains (check domain correct)
```

### 4. Verify File Permissions

**Application directories:**
```bash
chmod 775 storage/
chmod 775 bootstrap/cache/
# Important for Laravel file writes
```

---

## 📞 Getting Help

If issues persist:

1. **Check logs thoroughly** - Most issues visible there
2. **Test locally first** - Reproduce issue locally before debugging production
3. **Compare with .env.example** - Make sure all required vars set
4. **Railway Docs** - https://docs.railway.app/common-questions
5. **Vercel Docs** - https://vercel.com/docs/troubleshooting
6. **Laravel Docs** - https://laravel.com/docs/troubleshooting

Good luck! 🍀
