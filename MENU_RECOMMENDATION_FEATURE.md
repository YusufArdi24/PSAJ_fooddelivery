# Fitur Rekomendasi Menu dan Menu Populer

## Overview
Dokumentasi ini menjelaskan implementasi dua fitur baru pada sistem Food Delivery:
1. **Menu Populer Hari Ini** - Menu yang paling banyak dipesan hari ini
2. **Rekomendasi Menu Hari Ini** - Menu yang direkomendasikan berdasarkan Collaborative Filtering

## Fitur 1: Menu Populer Hari Ini

### Cara Kerja
- Sistem menghitung jumlah pesanan untuk setiap menu pada hari ini
- Menu dengan total pesanan terbanyak akan ditandai sebagai "Menu Populer Hari Ini"
- Hanya satu menu yang bisa menjadi populer per hari
- Hanya menu yang tersedia (`is_available = true`) yang bisa menjadi populer

### Implementasi Backend
**File:** `be/app/Http/Controllers/Api/MenuController.php`

**Method:** `getTodayPopularMenuId()`
```php
private function getTodayPopularMenuId()
{
    $today = now()->startOfDay();
    
    $popularMenu = DB::table('order_details')
        ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
        ->join('menus', 'order_details.MenuID', '=', 'menus.MenuID')
        ->where('orders.order_date', '>=', $today)
        ->where('menus.is_available', true)
        ->select('order_details.MenuID', DB::raw('SUM(order_details.quantity) as total_orders'))
        ->groupBy('order_details.MenuID')
        ->orderByDesc('total_orders')
        ->first();
    
    return $popularMenu ? $popularMenu->MenuID : null;
}
```

**Query Logic:**
1. Join `order_details`, `orders`, dan `menus`
2. Filter order dari hari ini (`order_date >= today`)
3. Filter menu yang tersedia (`is_available = true`)
4. Group by MenuID dan hitung total quantity
5. Urutkan descending berdasarkan total orders
6. Ambil yang teratas

## Fitur 2: Rekomendasi Menu Hari Ini

### Cara Kerja (Collaborative Filtering)
Algoritma ini menggunakan metode **User-Based Collaborative Filtering**:

1. **Identifikasi Riwayat User:**
   - Sistem melihat menu apa saja yang pernah dipesan oleh user saat ini

2. **Cari User Serupa:**
   - Sistem mencari user lain yang juga pernah memesan menu yang sama

3. **Analisis Pola Pembelian:**
   - Sistem melihat menu lain apa yang dibeli oleh user-user serupa tersebut

4. **Generate Rekomendasi:**
   - Menu yang sering dibeli oleh user serupa (tapi belum dibeli user saat ini) akan direkomendasikan
   - Maksimal 3 rekomendasi teratas

### Contoh Skenario
```
User A membeli: Ayam Geprek, Nasi Goreng
User B membeli: Ayam Geprek, Mie Goreng
User C membeli: Ayam Geprek, Mie Goreng, Es Teh

Jika User D baru membeli Ayam Geprek:
→ Sistem menemukan User A, B, C sebagai user serupa
→ Menu yang sering dibeli: Mie Goreng (2x), Nasi Goreng (1x), Es Teh (1x)
→ Rekomendasi untuk User D: Mie Goreng, Nasi Goreng, Es Teh
```

### Implementasi Backend
**File:** `be/app/Http/Controllers/Api/MenuController.php`

**Method:** `getRecommendedMenuIds($customerId)`
```php
private function getRecommendedMenuIds($customerId)
{
    // Step 1: Get items that this customer has ordered
    $customerMenus = DB::table('order_details')
        ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
        ->where('orders.CustomerID', $customerId)
        ->distinct()
        ->pluck('order_details.MenuID')
        ->toArray();
    
    if (empty($customerMenus)) {
        return [];
    }
    
    // Step 2: Find other customers who ordered the same items
    $similarCustomers = DB::table('order_details')
        ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
        ->whereIn('order_details.MenuID', $customerMenus)
        ->where('orders.CustomerID', '!=', $customerId)
        ->distinct()
        ->pluck('orders.CustomerID')
        ->toArray();
    
    if (empty($similarCustomers)) {
        return [];
    }
    
    // Step 3: Find what else those similar customers ordered
    $recommendations = DB::table('order_details')
        ->join('orders', 'order_details.OrderID', '=', 'orders.OrderID')
        ->join('menus', 'order_details.MenuID', '=', 'menus.MenuID')
        ->whereIn('orders.CustomerID', $similarCustomers)
        ->whereNotIn('order_details.MenuID', $customerMenus)
        ->where('menus.is_available', true)
        ->select('order_details.MenuID', DB::raw('COUNT(DISTINCT orders.CustomerID) as customer_count'))
        ->groupBy('order_details.MenuID')
        ->orderByDesc('customer_count')
        ->limit(3)
        ->pluck('MenuID')
        ->toArray();
    
    return $recommendations;
}
```

**Query Logic (3 Langkah):**

**Langkah 1:** Dapatkan menu yang pernah dipesan user
- Join order_details dengan orders
- Filter by CustomerID
- Ambil distinct MenuID

**Langkah 2:** Cari user lain yang pernah pesan menu yang sama
- Join order_details dengan orders
- Filter menu yang ada di list langkah 1
- Exclude CustomerID saat ini
- Ambil distinct CustomerID

**Langkah 3:** Cari menu lain yang dibeli user-user tersebut
- Join order_details, orders, dan menus
- Filter by CustomerID dari langkah 2
- Exclude menu yang sudah dipesan user saat ini
- Filter menu yang tersedia
- Group by MenuID dan hitung berapa banyak customer yang beli
- Urutkan descending berdasarkan jumlah customer
- Limit 3 teratas

## API Response

Setiap menu object sekarang memiliki 2 field tambahan:
```json
{
  "MenuID": 1,
  "name": "Ayam Geprek",
  "price": 15000,
  "is_available": true,
  "has_promo": false,
  "is_popular_today": true,
  "is_recommended_today": false,
  ...
}
```

**Field Baru:**
- `is_popular_today` (boolean): true jika menu ini adalah yang paling populer hari ini
- `is_recommended_today` (boolean): true jika menu ini direkomendasikan untuk user ini

## Frontend Implementation

### File yang Diubah

1. **menuService.ts** (`fe/src/services/menuService.ts`)
   - Menambahkan field `is_popular_today` dan `is_recommended_today` ke interface `MenuItem`
   - Update `convertMenuToFrontendFormat` untuk mapping field baru

2. **MenuContext.tsx** (`fe/src/contexts/MenuContext.tsx`)
   - Menambahkan field `isPopular` dan `isRecommended` ke interface `FrontendMenuItem`

3. **FoodCard.tsx** (`fe/src/components/FoodCard.tsx`)
   - Menambahkan props `isPopular` dan `isRecommended`
   - Import icon baru: `TrendingUp` dan `Sparkles` dari lucide-react
   - **Mengubah posisi badge dari kanan atas ke kiri atas**
   - Menambahkan badge "Populer Hari Ini" (gradient orange-red dengan icon TrendingUp)
   - Menambahkan badge "Rekomendasi" (gradient purple-pink dengan icon Sparkles)
   - Badge promo tetap di kanan atas

4. **Dashboard.tsx** (`fe/src/pages/Dashboard.tsx`)
   - Pass props `isPopular` dan `isRecommended` ke component FoodCard

### Tampilan Badge

**Posisi Badge:**
- **Kiri Atas:**
  - Badge "Populer Hari Ini" (jika applicable)
  - Badge "Rekomendasi" (jika applicable)

- **Kanan Atas:**
  - Badge "Tersedia" / "Tidak Tersedia" (selalu ada)
  - Badge Promo/Diskon (jika applicable)

**Styling Badge:**

1. **Badge Populer:**
   ```tsx
   <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
     <TrendingUp /> Populer Hari Ini
   </span>
   ```

2. **Badge Rekomendasi:**
   ```tsx
   <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
     <Sparkles /> Rekomendasi
   </span>
   ```

## Kondisi Tampilan

Badge hanya ditampilkan jika:
1. Menu tersedia (`available = true`)
2. Dan memenuhi kriteria (popular atau recommended)

Jika menu tidak tersedia, hanya badge "Tidak Tersedia" yang ditampilkan.

## Cara Kerja Personalisasi

- **Menu Populer:** Sama untuk semua user (berdasarkan data global)
- **Rekomendasi:** Personal untuk setiap user (berdasarkan authentication token)
- Jika user belum login, rekomendasi tidak akan muncul
- Jika user baru (belum pernah order), rekomendasi tidak akan muncul

## Testing

### Test Menu Populer:
1. Buat beberapa order untuk menu tertentu pada hari ini
2. Menu dengan order terbanyak akan mendapat badge "Populer Hari Ini"

### Test Rekomendasi:
1. User A order: Menu 1, Menu 2
2. User B order: Menu 1, Menu 3
3. User C order: Menu 1, Menu 3, Menu 4
4. Login sebagai User A
5. User A seharusnya mendapat rekomendasi: Menu 3, Menu 4
6. Karena user lain yang juga pesan Menu 1 sering pesan Menu 3 dan 4

## Optimisasi

Untuk performa yang lebih baik pada production:
1. **Cache:** Simpan hasil `getTodayPopularMenuId()` dalam cache dengan TTL 5-10 menit
2. **Cache:** Simpan hasil `getRecommendedMenuIds()` per user dengan TTL 15-30 menit
3. **Index:** Pastikan ada index pada kolom:
   - `orders.order_date`
   - `orders.CustomerID`
   - `order_details.MenuID`
   - `menus.is_available`

## Keterbatasan & Future Improvements

### Keterbatasan Saat Ini:
1. Rekomendasi hanya untuk user yang sudah pernah order
2. Tidak ada fallback jika tidak ada user serupa
3. Hanya menggunakan user-based CF (bisa ditambah item-based CF)

### Saran Perbaikan:
1. **Cold Start Problem:** Untuk user baru, tampilkan menu paling populer secara global
2. **Hybrid Recommendation:** Gabungkan collaborative filtering dengan content-based (kategori menu, harga, dll)
3. **Time Decay:** Berikan bobot lebih untuk pesanan terbaru
4. **Diversity:** Pastikan rekomendasi dari kategori yang beragam
5. **A/B Testing:** Test efektivitas rekomendasi terhadap conversion rate

## Database Dependencies

Fitur ini menggunakan tabel:
- `orders` - untuk data pesanan dan tanggal
- `order_details` - untuk detail item pesanan
- `menus` - untuk data menu dan status ketersediaan
- `customers` - untuk identifikasi user (via authentication)

Tidak ada perubahan schema database yang diperlukan.

---

**Dokumentasi dibuat:** 6 Maret 2026
**Versi:** 1.0
