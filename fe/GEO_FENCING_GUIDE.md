# 🗺️ Geo-Fencing Documentation
**Fitur Pembatasan Akses Berdasarkan Lokasi**

## 📋 Overview
Fitur geo-fencing membatasi akses website hanya untuk user yang berada di dalam area layanan Perumahan Bukit Kalibagor Indah. Fitur ini selalu aktif untuk semua user, bahkan yang sudah login.

## 🎯 Lokasi Target
- **Nama Area**: Perumahan Bukit Kalibagor Indah
- **Koordinat Tengah**: 
  - Latitude: -7.4857433
  - Longitude: 109.2945344
- **Koordinat Polygon**:
  ```javascript
  const serviceArea = [
    [-7.4835, 109.2915], // Barat Laut
    [-7.4835, 109.2975], // Timur Laut  
    [-7.4885, 109.2975], // Timur Selatan
    [-7.4885, 109.2915], // Barat Selatan
  ];
  ```

## 🚀 Alur Kerja
1. **Halaman Pertama**: User mengakses website → Langsung melihat halaman geo-fencing
2. **Deteksi Lokasi**: Sistem meminta ijin akses lokasi browser
3. **Validasi**: Menggunakan algoritma Point-in-Polygon untuk mengecek posisi user
4. **Hasil**:
   - ✅ **Dalam Area**: Redirect otomatis ke `/signup` setelah 3 detik
   - ❌ **Luar Area**: Tampilkan pesan akses ditolak dengan peta

## 🔧 Komponen Utama

### 1. `/src/pages/GeoFencing.tsx`
- Halaman utama geo-fencing
- Menampilkan peta interaktif dengan Leaflet.js
- Menangani semua logic lokasi dan validasi

### 2. `/src/components/LocationCheckWrapper.tsx`
- Wrapper untuk routes yang dilindungi
- Re-validasi lokasi setiap 30 menit
- Memastikan user tetap dalam area layanan

## 🛡️ Protected Routes
Routes yang dilindungi LocationCheckWrapper:
- `/dashboard`
- `/settings` 
- `/order-history`

## 🎨 UI Features

### Loading State
- Animasi spinner saat deteksi lokasi
- Pesan "Memeriksa Lokasi Anda"

### Success State (Dalam Area)
- Ikon checkmark hijau
- Peta interaktif menampilkan lokasi user + polygon area
- Countdown redirect ke signup

### Error State (Luar Area)
- Ikon X merah  
- Peta menampilkan lokasi user di luar polygon
- Informasi detail area layanan
- Tombol retry untuk lokasi

### Error Handling
- Permission denied: Panduan cara mengaktifkan lokasi
- GPS not available: Instruksi mengaktifkan GPS
- Timeout: Tombol coba lagi
- Browser not supported: Pesan fallback

## 🛠️ Development Mode
Untuk keperluan testing, tersedia tombol bypass di development mode:
```javascript
// Hanya muncul jika import.meta.env.DEV = true
🚧 Dev: Bypass Geo-fencing
```

## 💾 Session Management
- **locationValidated**: Flag validasi lokasi 
- **lastLocationCheck**: Timestamp validasi terakhir
- Re-check otomatis setiap 30 menit

## 🔄 Re-validation Logic
LocationCheckWrapper akan otomatis:
1. Cek apakah sudah divalidasi dalam 30 menit terakhir
2. Jika belum, lakukan validasi cepat (low accuracy)
3. Redirect ke `/geo-fencing` jika di luar area atau gagal

## 🧪 Testing

### Test Cases
1. **User dalam area**: Harus bisa akses semua fitur
2. **User luar area**: Tidak bisa akses, redirect ke geo-fencing  
3. **Permission denied**: Tampilkan panduan aktivasi lokasi
4. **GPS off**: Tampilkan instruksi GPS
5. **Direct URL access**: Tetap tervalidasi via LocationCheckWrapper

### Development Testing
- Gunakan tombol bypass untuk simulasi
- Ubah koordinat polygon untuk testing
- Test dengan berbagai kondisi GPS/network

## 📱 Browser Compatibility
- ✅ Modern browsers dengan Geolocation API
- ✅ Mobile browsers (Android/iOS)
- ❌ Legacy browsers: Fallback ke halaman error

## 🎛️ Configuration
Untuk mengubah area layanan, edit polygon di:
- `/src/pages/GeoFencing.tsx` (line ~25)
- `/src/components/LocationCheckWrapper.tsx` (line ~12)

## 🚨 Production Notes
1. Hapus tombol bypass developer sebelum deploy
2. Pastikan HTTPS untuk Geolocation API
3. Consider rate limiting untuk validasi lokasi
4. Monitor accuracy GPS vs area boundaries

---
**✨ Fitur geo-fencing sudah siap digunakan!**