# Panduan Setup Google Login

## Langkah 1 — Buat Project di Google Cloud Console

1. Buka [https://console.cloud.google.com/](https://console.cloud.google.com/)
2. Login dengan akun Google Anda
3. Klik **"Select a project"** di bagian atas → **"New Project"**
4. Beri nama project (misal: `Warung Edin`) → klik **"Create"**

---

## Langkah 2 — Aktifkan Google OAuth

1. Di menu kiri, pilih **APIs & Services → OAuth consent screen**
2. Pilih **External** → klik **Create**
3. Isi:
   - **App name**: `Warung Edin`
   - **User support email**: email Anda
   - **Developer contact information**: email Anda
4. Klik **Save and Continue** (lewati langkah Scopes dan Test Users)
5. Klik **Back to Dashboard**

---

## Langkah 3 — Buat OAuth Client ID

1. Di menu kiri, pilih **APIs & Services → Credentials**
2. Klik **"+ Create Credentials"** → **"OAuth client ID"**
3. Pilih **Application type: Web application**
4. Beri nama (misal: `Warung Edin Web`)
5. Di bagian **Authorized JavaScript origins**, tambahkan:
   - `http://localhost:5173` (untuk development)
   - URL production Anda jika sudah ada (misal: `https://yourdomain.com`)
6. Di bagian **Authorized redirect URIs**, tambahkan:
   - `http://localhost:5173`
7. Klik **Create**
8. **Copy Client ID** yang muncul (format: `XXXXXXXXXX.apps.googleusercontent.com`)

---

## Langkah 4 — Tambahkan ke .env

Buka file `fe/.env` dan ganti:

```
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
```

menjadi:

```
VITE_GOOGLE_CLIENT_ID=XXXXXXXXXX.apps.googleusercontent.com
```

*Ganti `XXXXXXXXXX.apps.googleusercontent.com` dengan Client ID yang Anda salin.*

---

## Langkah 5 — Restart Dev Server

```bash
cd fe
npm run dev
```

Sekarang tombol **"Lanjutkan dengan Google"** di halaman Sign In dan Sign Up sudah berfungsi!

---

## Catatan Penting

- Tombol Google akan nonaktif (disabled) selama `VITE_GOOGLE_CLIENT_ID` masih diisi `YOUR_GOOGLE_CLIENT_ID_HERE`
- Google OAuth hanya bekerja di domain yang terdaftar di Authorized JavaScript origins
- Untuk production: tambahkan juga URL production di Authorized JavaScript origins

---

## Alur Login Google

```
User klik tombol → Popup Google muncul → User pilih akun
→ Frontend dapat access_token → Kirim ke backend
→ Backend verifikasi ke Google API → Buat/temukan akun customer
→ Backend kembalikan Sanctum token → User masuk ke dashboard
```
