# 🚀 Panduan Deployment ke Vercel (Frontend) & Railway (Backend)

## 📍 Persiapan Awal

Sebelum melakukan deployment, pastikan Anda memiliki:
- Akun GitHub dengan repository project ini sudah ter-push
- Akun Vercel (https://vercel.com) - sign up dengan GitHub  
- Akun Railway (https://railway.app) - sign up dengan GitHub
- Akun Midtrans untuk payment gateway (sudah dikonfigurasi)
- Gmail App Password untuk email service

---

## 🎯 BACKEND DEPLOYMENT (Railway)

### Step 1️⃣: Persiapan Repository

**A. Update .env.example untuk dokumentasi**
File `.env.example` sudah dibuat di `/be/.env.example` dengan template lengkap.

**B. Buat composer.lock & pastikan dependencies siap**
```bash
cd be
composer install --no-dev
git add composer.lock
git commit -m "Update composer dependencies"
git push
```

⚠️ **Jika mendapat error "ext-zip is missing"**:
- **Option 1 (Recommended)**: Enable zip extension di php.ini Anda
  - Buka: `php.ini` → cari `;extension=zip` → hapus semicolon → simpan
  - Restart Laragon
- **Option 2**: Gunakan flag `--ignore-platform-req=ext-zip` untuk local testing:
  ```bash
  composer install --no-dev --ignore-platform-req=ext-zip
  ```
  - Railway server sudah punya zip extension, jadi ini hanya untuk local development

**C. Pastikan semua file konfigurasi sudah ada:**
- ✅ `Procfile` - Konfigurasi untuk Railway
- ✅ `railway.toml` - Configuration file Railway
- ✅ `.env.example` - Template environment variables

### Step 2️⃣: Setup Database di Railway

1. **Login ke Railway Dashboard** → https://railway.app/dashboard
2. **Buat Project Baru**:
   - Klik "+ New Project"
   - Pilih "Provision MySQL"
   - Tunggu database siap

3. **Setup Environment Variables**:
   - Di Railway Dashboard, buka project Anda
   - Klik tab "Variables"
   - Tambahkan semua variable dari `.env.example`:

| Variable | Nilai |
|----------|-------|
| `DATABASE_URL` | Akan di-generate Railway |
| `APP_NAME` | Warung Edin |
| `APP_ENV` | production |
| `APP_DEBUG` | false |
| `APP_KEY` | Generate di local: `php artisan key:generate` |
| `APP_URL` | https://your-backend-url.railway.app (update setelah deployment) |
| `FRONTEND_URL` | https://your-frontend-url.vercel.app |
| `DB_CONNECTION` | mysql |
| `DB_HOST` | ${{ MYSQL_HOST }} |
| `DB_PORT` | ${{ MYSQL_PORT }} |
| `DB_DATABASE` | ${{ MYSQL_DATABASE }} |
| `DB_USERNAME` | ${{ MYSQL_USER }} |
| `DB_PASSWORD` | ${{ MYSQL_PASSWORD }} |
| `MAIL_MAILER` | smtp |
| `MAIL_HOST` | smtp.gmail.com |
| `MAIL_PORT` | 587 |
| `MAIL_USERNAME` | your-email@gmail.com |
| `MAIL_PASSWORD` | your-gmail-app-password |
| `MAIL_FROM_ADDRESS` | your-email@gmail.com |
| `MIDTRANS_SERVER_KEY` | Your Midtrans Server Key |
| `MIDTRANS_CLIENT_KEY` | Your Midtrans Client Key |
| `MIDTRANS_IS_PRODUCTION` | false (atau true jika production) |
| `SESSION_DRIVER` | database |
| `CACHE_STORE` | database |
| `QUEUE_CONNECTION` | database |
| `LOG_LEVEL` | notice |

### Step 3️⃣: Connect GitHub Repository ke Railway

1. **Di Railway Dashboard**:
   - Klik "New Service" → "GitHub Repo"
   - Pilih GitHub repository Anda (PSAJ_fooddelivery)
   - Deploy from branch: `main` (atau branch Anda)

2. **Railway akan otomatis**:
   - Membaca Procfile & railway.toml
   - Install dependencies (`composer install`)
   - Run migrations (`php artisan migrate --force`)
   - Start PHP server

### Step 4️⃣: Verifikasi Backend Deployment

```bash
# Test backend API
curl https://your-railway-url.railway.app/api/v1/menus
```

**Expected Response**: JSON array of menus

**Troubleshooting**:
```bash
# Check logs di Railway Dashboard → View Logs
# Atau jika ada error, lihat:
# 1. Database connection
# 2. APP_KEY sudah di-generate
# 3. Migrations sudah terjalankan
```

---

## 🎨 FRONTEND DEPLOYMENT (Vercel)

### Step 1️⃣: Persiapan Repository

**A. Update API Configuration untuk Production**

Edit file [fe/src/lib/api.ts](fe/src/lib/api.ts):

```typescript
// Detect environment dan set API URL accordingly
const isDevelopment = import.meta.env.MODE === 'development';

export const API_BASE_URL = isDevelopment 
  ? '/api/v1'  // Use proxy in development
  : import.meta.env.VITE_API_BASE_URL || '/api/v1';
```

**B. Update .env.example** (sudah dibuat di [fe/.env.example](fe/.env.example))

**C. Commit & Push**
```bash
cd fe
git add . 
git commit -m "Update deployment configurations"
git push
```

### Step 2️⃣: Setup di Vercel

1. **Login ke Vercel** → https://vercel.com/dashboard
2. **Import GitHub Repository**:
   - Klik "Add New..." → "Project"
   - Pilih GitHub repository Anda
   - Vercel akan auto-detect sebagai Vite project

3. **Configure Project**:
   - **Root Directory**: `fe` ⚠️ PENTING!
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

4. **Add Environment Variables**:
   - Di Vercel Dashboard → Project Settings → Environment Variables
   - Tambahkan:

| Variable | Nilai |
|----------|-------|
| `VITE_API_BASE_URL` | https://your-railway-backend-url.railway.app/api/v1 |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |

### Step 3️⃣: Deploy ke Vercel

1. Klik "Deploy"
2. Tunggu deployment selesai (~2-3 menit)
3. Vercel akan memberikan live URL

### Step 4️⃣: Update Railway Backend

Setelah mendapat Vercel URL:

1. **Kembali ke Railway Dashboard**
2. **Update variable**: `FRONTEND_URL` = `https://your-vercel-url.vercel.app`
3. Ini diperlukan untuk CORS configuration di backend

---

## 🔗 API Integration

### Update Backend CORS Configuration

Edit [be/config/cors.php](be/config/cors.php) atau `.env`:

```env
FRONTEND_URL=https://your-vercel-url.vercel.app
```

Backend akan automatically allow requests dari FRONTEND_URL.

### Test Integration

```bash
# 1. Test dari Frontend console
# Di Vercel URL → Open DevTools → Console
fetch('https://your-railway-backend.railway.app/api/v1/menus')
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## 📦 Database & Storage

### Railway Database

Railway secara otomatis menyediakan MySQL database:
- Hostname: `gateway.railway.app`
- Port: Railway akan assign port
- Database name, username, password: di-generate Railway

**Connection**: Gunakan `${{ MYSQL_HOST }}` placeholder di environment variables.

### File Storage

**Untuk production, gunakan salah satu:**

#### Option 1: AWS S3 (Recommended)
```env
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_DEFAULT_REGION=ap-southeast-1
AWS_BUCKET=your-bucket
```

#### Option 2: Keep using local (temporary)
```env
FILESYSTEM_DISK=local
```

---

## ✅ Post-Deployment Checklist

- [ ] Backend API test: `curl https://your-backend.railway.app/api/v1/menus`
- [ ] Frontend loads: `https://your-frontend.vercel.app`
- [ ] Google Login works
- [ ] Can register & login
- [ ] Can browse menus & add to cart
- [ ] Payment gateway works (Midtrans test mode)
- [ ] Email verification sends
- [ ] Notifications work

---

## 🐛 Troubleshooting

### Frontend Deployment Issues

**Build fails**:
```bash
# Test locally first
cd fe
npm ci
npm run build
```

**API calls fail (CORS)**:
- Check FRONTEND_URL di backend
- Check VITE_API_BASE_URL di Vercel environment variables
- Check browser console for error messages

**Blank page/404**:
- Vercel rewrites sudah di `vercel.json` ✅
- Check build output in Vercel logs

### Backend Deployment Issues

**Database connection fails**:
- Verify DATABASE credentials di Railway variables
- Check MySQL service is running in Railway

**Migrations fail**:
- Check app key di DATABASE
- Check DB_HOST format (use ${{ MYSQL_HOST }})

**Email not sending**:
- Gmail needs "App Passwords" (2FA enabled)
- Or use other SMTP provider

**Midtrans payment fails**:
- Verify keys match Midtrans dashboard
- Check `MIDTRANS_IS_PRODUCTION` (false untuk test)

---

## 🔄 Continuous Deployment

Setiap kali Anda push ke GitHub:
- ✅ Vercel otomatis re-deploy frontend
- ✅ Railway otomatis re-deploy backend

No manual deployment needed! 🎉

---

## 📱 Domain Custom (Optional)

### Add Custom Domain ke Vercel
1. Dashboard → Project → Settings → Domains
2. Add custom domain (contoh: app.yourdomain.com)
3. Update DNS records

### Add Custom Domain ke Railway
1. Settings → Custom Domain
2. Point DNS ke Railway
3. Update FRONTEND_URL di backend jika berubah

---

## 🔐 Security Tips

1. **Never commit .env files** - Sudah di `.gitignore` ✅
2. **Use strong passwords** di database
3. **Rotate sensitive keys** periodically
4. **Enable 2FA** di GitHub, Vercel, Railway
5. **Keep dependencies updated**:
   ```bash
   # Backend
   cd be
   composer update --no-dev
   
   # Frontend
   cd fe
   npm update
   ```

---

## 📞 Support Links

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Laravel Deployment: https://laravel.com/docs/deployment
- Vite Production: https://vitejs.dev/guide/static-deploy
- Midtrans: https://docs.midtrans.com
- Gmail SMTP: https://support.google.com/accounts/answer/185833

---

## ⏭️ Next Steps

1. **Push code ke GitHub** dengan semua file baru
2. **Deploy backend ke Railway** terlebih dahulu
3. **Get Railway URL** dan update di Vercel
4. **Deploy frontend ke Vercel**
5. **Test integration** antara FE & BE
6. **Monitor logs** di Railway & Vercel

Selamat deploy! 🚀
