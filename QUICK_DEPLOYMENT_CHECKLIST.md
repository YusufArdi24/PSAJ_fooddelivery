# 🚀 Quick Deployment Checklist

## Pre-Deployment (Local)

### 1. Prepare Code
- [ ] All changes committed to Git
- [ ] Test locally: `npm run dev` (FE) & `php artisan serve` (BE)
- [ ] No errors in console or logs
- [ ] `.env` files NOT committed (use `.gitignore`)

### 2. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Backend Deployment (Railway)

### 1. Create Railway Project
- [ ] Visit https://railway.app/dashboard
- [ ] Click "+ New Project"
- [ ] Provision MySQL
- [ ] Wait for database ready

### 2. Add Environment Variables in Railway

Set these in Railway Dashboard → Variables:

```
APP_NAME=Warung Edin
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_KEY_FROM_LOCAL
APP_URL=https://your-backend-url.railway.app
FRONTEND_URL=https://your-frontend-url.vercel.app

DB_CONNECTION=mysql
DB_HOST=${{ MYSQL_HOST }}
DB_PORT=${{ MYSQL_PORT }}
DB_DATABASE=${{ MYSQL_DATABASE }}
DB_USERNAME=${{ MYSQL_USER }}
DB_PASSWORD=${{ MYSQL_PASSWORD }}

MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=your-email@gmail.com

MIDTRANS_SERVER_KEY=your-key
MIDTRANS_CLIENT_KEY=your-key
MIDTRANS_IS_PRODUCTION=false

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### 3. Connect GitHub Repository
- [ ] Railway → New Service → GitHub Repo
- [ ] Select `PSAJ_fooddelivery`
- [ ] Railway auto-deploys & runs migrations

### 4. Get Backend URL
- [ ] Railway Dashboard → Deployments
- [ ] Copy public URL (e.g., `https://xxx.railway.app`)
- [ ] Test: `curl https://xxx.railway.app/api/v1/menus`

---

## Frontend Deployment (Vercel)

### 1. Connect to Vercel
- [ ] Visit https://vercel.com/dashboard
- [ ] "Add New" → "Project"
- [ ] Select GitHub repository

### 2. Configure Build Settings
- [ ] Root Directory: `fe`
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Install Command: `npm ci`

### 3. Add Environment Variables in Vercel

Add in Project Settings → Environment Variables:

```
VITE_API_BASE_URL=https://your-railway-backend-url.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=1005384546839-dc85a0v3fb1o6etlhe5rakivsfbc795a.apps.googleusercontent.com
```

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait ~2-3 minutes
- [ ] Get Vercel frontend URL

---

## Post-Deployment

### 1. Update Railway CORS
- [ ] Go to Railway → Variables
- [ ] Update `FRONTEND_URL` = your Vercel URL
- [ ] Redeploy backend

### 2. Test Integration

**Test Backend API:**
```bash
curl https://your-railway.railway.app/api/v1/menus
# Should return JSON array of menus
```

**Test Frontend:**
- [ ] Visit Vercel URL
- [ ] Check browser console (F12)
- [ ] Should see API calls to Railway backend
- [ ] Try registration/login flow

### 3. Verify Features
- [ ] [ ] Login with email/password works
- [ ] [ ] Google login works
- [ ] [ ] Browse menus displays correctly
- [ ] [ ] Add to cart works
- [ ] [ ] Checkout process works
- [ ] [ ] Payment gateway (Midtrans) works
- [ ] [ ] Email verification sends
- [ ] [ ] Notifications work (optional)

---

## Troubleshooting Quick Fixes

### Frontend Build Fails
```bash
cd fe
npm ci --force
npm run build
# Check if dist/ folder created
```

### API 404 Error in Frontend
- [ ] Check VITE_API_BASE_URL di Vercel matches Railway URL
- [ ] Check Railway backend is running (view logs)
- [ ] Clear browser cache & reload

### CORS Error
- [ ] Update FRONTEND_URL di Railway di set ke Vercel URL
- [ ] Restart Railway (redeploy)
- [ ] Wait 5 minutes for cache clear

### Database Connection Error di Railway
- [ ] Verify DB variables: `${{ MYSQL_HOST }}`, `${{ MYSQL_PORT }}`, etc.
- [ ] Check MySQL service running
- [ ] Check Procfile has: `release: php artisan migrate --force`

### Email Not Sending
- [ ] Gmail requires App Passwords (2FA enabled)
- [ ] Generate at: https://myaccount.google.com/apppasswords
- [ ] Use generated password, not Gmail password

---

## Success Indicators ✅

- ✅ Frontend URL loads without errors
- ✅ Browser console has no CORS errors
- ✅ API calls shown in Network tab going to Railway
- ✅ Can register new account
- ✅ Can login successfully
- ✅ Menu items load and display
- ✅ Cart functionality works
- ✅ Checkout process completes
- ✅ Payment gateway redirects properly

---

## Redeployment (Continuous Deployment)

**Going forward:**
- Simply `git push` to GitHub main branch
- Vercel auto-redeploys frontend (1-2 min)
- Railway auto-redeploys backend (2-3 min)
- No manual steps needed! 🎉

---

## Emergency Rollback

If something breaks:

**Vercel:**
- Dashboard → Deployments → Select previous version → "Rollback"

**Railway:**
- Dashboard → Deployments → Select previous → "Deploy"

---

## Useful Links

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Railway CLI: https://docs.railway.app/cli/cli-reference
- Midtrans Sandbox: https://dashboard.sandbox.midtrans.com

Let's go deploy! 🚀
