# 📋 DEPLOYMENT_READINESS_CHECKLIST.md

## ✅ Project Deployment Status

### Project: PSAJ Food Delivery - Warung Edin
**Frontend**: React + TypeScript + Vite + Tailwind CSS  
**Backend**: Laravel 12 + MySQL + Sanctum Auth  
**Target**: Vercel (FE) + Railway (BE)

---

## 📦 Files Created for Deployment

### Frontend (`fe/`)
- ✅ **vercel.json** - Vercel deployment configuration
  - Auto-detects Vite build
  - Configures rewrites for SPA routing
  - Sets cache headers
  
- ✅ **.env.example** - Template for environment variables
  - VITE_API_BASE_URL (Railway backend URL)
  - VITE_GOOGLE_CLIENT_ID (Google OAuth)
  
- ✅ **Updated src/lib/api.ts** - Dynamic API URL handling
  - Uses proxy in dev (`/api/v1`)
  - Uses VITE_API_BASE_URL in production
  
- ✅ **.env** - Updated with documentation
  - VITE_GOOGLE_CLIENT_ID already configured
  - VITE_API_BASE_URL ready for Vercel env var

### Backend (`be/`)
- ✅ **Procfile** - Railway/Heroku deployment configuration
  - Runs PHP Apache2 server
  - Auto-runs migrations on deploy
  
- ✅ **railway.toml** - Railway-specific configuration
  - Nixpacks builder
  - Restart policy settings
  
- ✅ **.env.example** - Complete template with all required variables
  - Database configuration
  - Mail/SMTP settings
  - Midtrans payment keys
  - VAPID keys for push notifications

### Root Folder
- ✅ **DEPLOYMENT_GUIDE.md** - Complete 📖 step-by-step guide
  - Railway backend setup (2500+ words)
  - Vercel frontend setup
  - API integration instructions
  - Post-deployment verification
  - Troubleshooting section
  
- ✅ **QUICK_DEPLOYMENT_CHECKLIST.md** - Rapid reference ⚡
  - Pre-deployment checklist
  - Railway setup steps
  - Vercel setup steps
  - Post-deployment verification
  - Emergency rollback procedures
  
- ✅ **TROUBLESHOOTING.md** - 🔧 Common issues & solutions
  - 8 major issue categories
  - Specific symptoms and fixes
  - Test commands provided
  - Debugging strategies

---

## 🚀 How to Use These Files

### For Your First Deployment:

1. **Read**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Full context & understanding
2. **Execute**: [QUICK_DEPLOYMENT_CHECKLIST.md](QUICK_DEPLOYMENT_CHECKLIST.md) - Step-by-step
3. **Reference**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - If something breaks

### For Re-deployments:

- Just push to GitHub - Vercel & Railway auto-deploy! 🎉
- No manual steps needed going forward

### For Debugging:

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for specific errors
- Most issues have quick fixes documented

---

## 🔑 Key Configuration Points

### Frontend → Vercel

| Variable | Purpose | Vercel Env Name |
|----------|---------|-----------------|
| API Base URL | Points to Railway backend | `VITE_API_BASE_URL` |
| Google OAuth | For Google login | `VITE_GOOGLE_CLIENT_ID` |

### Backend → Railway

| Variable | Purpose | Value |
|----------|---------|-------|
| DATABASE | MySQL on Railway | `${{ MYSQL_* }}` placeholders |
| APP_KEY | Laravel encryption | Auto-generated locally |
| APP_URL | Backend public URL | Railway auto-assigns |
| FRONTEND_URL | For CORS configuration | Update after Vercel deploy |
| MAIL_* | Email sending | Gmail + App Password |
| MIDTRANS_* | Payment gateway | Sandbox keys provided |

---

## ⚠️ Critical Setup Requirements

### Before Deploying:

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

2. **Generate Laravel APP_KEY** (if not already done)
   ```bash
   cd be
   php artisan key:generate
   # Copy the key from .env to use in Railway
   ```

3. **Prepare credentials**
   - 🔑 Gmail App Password (for SMTP)
   - 🔑 Midtrans Server & Client Keys
   - ✅ Google OAuth Client ID (already in code)

### During Deployment:

1. **Railway First** (backend must be up before frontend)
   - Add database & environment variables
   - Connect GitHub repo
   - Wait for green checkmark ✅

2. **Get Railway URL**
   - Copy public URL from Railway Dashboard

3. **Vercel Next** (frontend)
   - Set VITE_API_BASE_URL = Railway URL
   - Deploy
   - Get Vercel URL

4. **Update Railway**
   - Set FRONTEND_URL = Vercel URL
   - Redeploy for CORS

---

## 📊 Deployment Architecture

```
GitHub (Source Code)
  ↓
  ├─→ Railway (Backend)
  │   ├─ PHP 8.2+ with Laravel
  │   ├─ MySQL Database
  │   ├─ Auto-runs migrations
  │   ├─ Public URL: xxx.railway.app
  │   └─ CORS: Allows Vercel frontend
  │
  └─→ Vercel (Frontend)
      ├─ React/TypeScript/Vite
      ├─ Builds to static files
      ├─ Public URL: xxx.vercel.app
      └─ Calls API at Railway backend
```

---

## 🔄 Continuous Deployment

### After First Deployment:

**Simply push code:**
```bash
git add .
git commit -m "Your message"
git push origin main
```

**Automatic actions:**
- ✅ GitHub receives push
- ✅ Vercel detects change → rebuilds & deploys frontend (~1-2 min)
- ✅ Railway detects change → runs migrations & deploys backend (~2-3 min)
- ✅ Your new code is live! 🎉

**No manual intervention needed** - fully automated continuous deployment!

---

## ✨ Post-Deployment Verification

### Verify Everything Works

```bash
# 1. Test backend API
curl https://your-railway.railway.app/api/v1/menus

# 2. Visit frontend
https://your-vercel.vercel.app

# 3. Open DevTools → Network tab
# 4. Try registering → Check API calls go to Railway

# 5. Verify features
✅ Login/Signup
✅ Browse menus
✅ Add to cart
✅ Google login
✅ Payment flow
✅ Email verification
```

---

## 🛠️ Quick Access Commands

### Local Development
```bash
# Frontend
cd fe && npm run dev

# Backend
cd be && php artisan serve

# Both together
cd be && npm run dev
```

### Push Changes
```bash
git add .
git commit -m "Your message"
git push
# Auto-deploys to both Vercel & Railway!
```

### View Logs
```bash
# Vercel: https://vercel.com/dashboard (select project → deployments → logs)
# Railway: https://railway.app/dashboard (select project → logs)
```

---

## 📚 Reference Documents

| File | Purpose | Audience |
|------|---------|----------|
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Complete guide with all steps | First-time deployers |
| [QUICK_DEPLOYMENT_CHECKLIST.md](QUICK_DEPLOYMENT_CHECKLIST.md) | Rapid reference | Anyone deploying |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Issue resolution | When things break |
| [.env.example](be/.env.example) | Backend vars template | Backend setup |
| [fe/.env.example](fe/.env.example) | Frontend vars template | Frontend setup |
| [vercel.json](fe/vercel.json) | Vercel config | Auto-applied |
| [Procfile](be/Procfile) | Railroad deploy config | Auto-applied |
| [railway.toml](be/railway.toml) | Railway config | Auto-applied |

---

## 🎯 Success Criteria

Your deployment is successful when:

- ✅ Frontend loads at Vercel URL
- ✅ No CORS errors in browser console
- ✅ API calls visible in Network tab → Going to Railway URL
- ✅ Can register → Receives verification email
- ✅ Can login → Sees dashboard with menus
- ✅ Can browse menus & search works
- ✅ Can add to cart & update quantities
- ✅ Can checkout with real data
- ✅ Midtrans payment flow works
- ✅ Order confirmation received
- ✅ Can view order history

---

## 🚀 Next Steps

1. **Read**: Take 15 mins to skim [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
2. **Prepare**: Gather credentials (Gmail, Midtrans keys)
3. **Push**: Git push your code with all new deployment files
4. **Deploy**: Follow [QUICK_DEPLOYMENT_CHECKLIST.md](QUICK_DEPLOYMENT_CHECKLIST.md)
5. **Test**: Use [TROUBLESHOOTING.md](TROUBLESHOOTING.md) if issues
6. **Share**: Your app is now live online! 🎉

---

## 💡 Pro Tips

- **Start with Vercel + Railway Free Tier** - No credit card for testing
- **Use HTTPS URLs** - Production requires HTTPS
- **Keep .env secure** - Never commit `.env` files
- **Monitor your apps** - Check Railway & Vercel dashboards weekly
- **Update dependencies** - Keep packages current: `composer update`, `npm update`
- **Use custom domain** - Optional for professional feel
- **Enable 2FA** - Secure your GitHub/Vercel/Railway accounts

---

## 📞 Need Help?

- 🔍 Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)first
- 📖 Re-read relevant section in [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- 🌐 Railway: https://docs.railway.app
- 🌐 Vercel: https://vercel.com/docs
- 🌐 Laravel: https://laravel.com/docs

---

**Good luck with your deployment! 🍀🚀**

Everything is ready to go. You've got this! 💪
