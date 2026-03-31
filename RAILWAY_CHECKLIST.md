# ✅ Railway Deployment Checklist

## Pre-Deployment (Sebelum Deploy ke Railway)

### GitHub Setup
- [ ] Code sudah di GitHub (main branch)
- [ ] `.env` file NOT tracked di git (.gitignore includes `.env`)
- [ ] Sensitive data TIDAK ada di commit history

### Code Preparation
- [ ] Jalankan `composer install --optimize-autoloader` di `/be`
- [ ] Jalankan `npm run build` di `/fe` (untuk test build)
- [ ] Update `.env.production` dengan correct URLs (lihat template di file)

### Database
- [ ] File migrations ada di `database/migrations/`
- [ ] Seeders ready (optional, tapi helpful untuk test data)

---

## Deployment Steps (Order Penting!)

### 1️⃣ Railway Account Setup (5 menit)
```
[ ] Buat akun di railway.app
[ ] Verify email
[ ] Create MySQL database
[ ] Save credentials (host, port, user, password, database)
```

### 2️⃣ Deploy Backend (15 menit)
```
[ ] Connect GitHub repo di Railway
[ ] Create service: warung-edin-api
[ ] Setup Environment Variables:
    [ ] APP_NAME=Warung Edin
    [ ] APP_ENV=production
    [ ] APP_DEBUG=false
    [ ] APP_URL=https://<domain>.up.railway.app
    [ ] FRONTEND_URL=https://<frontend-domain>
    [ ] DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
    [ ] MAIL_* credentials
    [ ] MIDTRANS_* keys
    [ ] VAPID_* keys
    [ ] GOOGLE_* keys (if setup)
[ ] Link MySQL database plugin
[ ] Check deployment logs → Status = SUCCESS
[ ] Copy public domain URL
```

### 3️⃣ Deploy Frontend (10 menit)
```
[ ] Create service: warung-edin-frontend
[ ] Setup Environment Variables:
    [ ] VITE_API_URL=https://<backend-domain>
    [ ] NODE_ENV=production
[ ] Check deployment logs → Status = SUCCESS
[ ] Copy public domain URL
```

---

## Post-Deployment Testing (Test SEBELUM go-live!)

### API Endpoints
```bash
# Test backend is running
curl https://warung-edin-api.up.railway.app/api/health

# Should return success response
```

### Frontend Access
```
[ ] Open https://warung-edin-frontend.up.railway.app
[ ] Page loads (no blank page)
[ ] Check browser console (no major errors)
```

### Authentication
```
[ ] Email/Password login works
[ ] Google OAuth login works (if configured)
[ ] Token persists on page refresh
```

### Business Logic
```
[ ] View menu items
[ ] View restaurant details
[ ] Create order
[ ] Make payment (test Midtrans)
[ ] View order history
[ ] Receive email notifications
```

### Admin Panel
```
[ ] Login ke https://warung-edin-api.up.railway.app/admin
[ ] Can view dashboard
[ ] Can view orders
[ ] Can manage menu items
[ ] Can manage restaurants
```

---

## Production Hardening (Setelah Testing OK)

### Security
```
[ ] Update Midtrans keys ke production (when ready to accept real money)
[ ] Enable HTTPS everywhere (Railway does this by default)
[ ] Setup custom domain (optional)
[ ] Enable 2FA di Google OAuth
[ ] Setup email domain verification
```

### Monitoring
```
[ ] Setup Railway email alerts
[ ] Monitor logs daily
[ ] Check error rates
[ ] Monitor database usage
```

### Database Backup
```
[ ] Setup Railway backup (if available in plan)
[ ] Or: Weekly manual exports dari Railway
[ ] Test restore procedure
```

---

## Troubleshooting Quick Reference

| Problem | Solution |
|---------|----------|
| Deploy error | Check Deployments tab logs, verify composer.json/package.json |
| 502 Bad Gateway | Lambda/app crashed - check railway logs |
| Database not connecting | Ensure environment variables set (DB_HOST, DB_PASSWORD, etc) |
| CORS errors | Update FRONTEND_URL in backend variables |
| Images not showing | Check storage URL matches frontend VITE_STORAGE_URL |
| Google login fails | Update OAuth redirect URI di Google Cloud Console |
| Midtrans payment fails | Verify MIDTRANS keys, check sandbox vs production |

---

## Important Notes 🎯

- **First deployment**: Akan gagal testing payment sampai Midtrans production keys diset
- **Database migration**: Railway otomatis run `php artisan migrate --force` saat deploy
- **File uploads**: Tersimpan di Railway filesystem (ephemeral storage - hilang saat redeploy)
  - **Solution**: Setup S3 (AWS) atau Railway PostgreSQL volumes untuk production
- **Cost**: $5/month free credit sudah cukup untuk development/testing
- **Support**: Railway support cepat, check docs di railway.app/docs

---

Generated: March 31, 2026 | Updated: [your-date]
