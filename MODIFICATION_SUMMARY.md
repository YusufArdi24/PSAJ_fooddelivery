# Ringkasan Modifikasi Sistem Food Delivery

**Tanggal:** 9 Maret 2026

## 1. Perbaikan Dashboard Pendapatan Admin ✅

### Masalah
Dashboard admin menampilkan nilai pendapatan yang salah karena tidak memperhitungkan diskon dengan benar.

### Solusi Implementasi
File yang dimodifikasi: `be/app/Filament/Admin/Widgets/StatsOverviewWidget.php`

**Perubahan:**
- Mengubah perhitungan pendapatan dari menggunakan `Payment.amount` menjadi langsung menggunakan `Order.total_price`
- `Order.total_price` sudah otomatis menghitung harga akhir setelah diskon
- Menghitung pendapatan hanya dari order dengan status `delivered` dan tidak disembunyikan dari admin

**Rumus Perhitungan:**
```php
// Pendapatan Hari Ini
$revenueToday = Order::where('status', 'delivered')
    ->where('hidden_from_admin', false)
    ->whereDate('order_date', Carbon::today())
    ->sum('total_price');

// Pendapatan Bulan Ini
$revenueThisMonth = Order::where('status', 'delivered')
    ->where('hidden_from_admin', false)
    ->whereMonth('order_date', Carbon::now()->month)
    ->whereYear('order_date', Carbon::now()->year)
    ->sum('total_price');
    
// Pendapatan Tahun Ini
$revenueThisYear = Order::where('status', 'delivered')
    ->where('hidden_from_admin', false)
    ->whereYear('order_date', Carbon::now()->year)
    ->sum('total_price');
```

**Keuntungan:**
- Perhitungan lebih akurat karena `total_price` di tabel Orders sudah mencakup diskon
- Lebih efisien karena tidak perlu join ke tabel Payment
- Konsisten dengan data yang ditampilkan di reports dan order details

---

## 2. Fitur Batalkan Pesanan (Cancel Order) ✅

### Fitur Baru
Menambahkan kemampuan untuk customer membatalkan pesanan yang masih berstatus `pending`.

### Backend Implementation

#### File: `be/app/Http/Controllers/Api/OrderController.php`

**Endpoint:** `PUT /api/v1/orders/{id}/cancel`

**Perubahan pada method `cancel()`:**
```php
public function cancel(Request $request, $id)
{
    // Validasi order milik customer
    $order = Order::where('OrderID', $id)
                 ->where('CustomerID', $request->user()->CustomerID)
                 ->first();
                 
    if (!$order) {
        return response()->json([
            'success' => false,
            'message' => 'Order not found'
        ], 404);
    }
    
    // HANYA pesanan dengan status 'pending' yang bisa dibatalkan
    if ($order->status !== 'pending') {
        return response()->json([
            'success' => false,
            'message' => 'Hanya pesanan dengan status pending yang bisa dibatalkan'
        ], 422);
    }
    
    DB::beginTransaction();
    
    try {
        // Hapus payment record
        if ($order->payment) {
            $order->payment->delete();
        }
        
        // Hapus order details
        $order->orderDetails()->delete();
        
        // Hapus order itu sendiri
        $order->delete();
        
        DB::commit();
        
        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibatalkan dan dihapus'
        ]);
    } catch (\Exception $e) {
        DB::rollback();
        
        return response()->json([
            'success' => false,
            'message' => 'Gagal membatalkan pesanan: ' . $e->getMessage()
        ], 500);
    }
}
```

**Perubahan Perilaku:**
- ❌ **Sebelumnya:** Mengubah status order menjadi `cancelled` (data tetap ada di database)
- ✅ **Sekarang:** Menghapus order secara permanen dari database beserta:
  - Order details (items dalam pesanan)
  - Payment record
  - Order record itu sendiri
- ⚠️ **Batasan:** Hanya pesanan dengan status `pending` yang bisa dibatalkan
- 🚫 **Tidak bisa dibatalkan:** Pesanan dengan status `confirmed`, `delivered`, atau status lainnya

### Frontend Implementation

#### File: `fe/src/pages/OrderHistory.tsx`

**Perubahan:**
1. Menambahkan import `Loader2` dan `X` icons dari lucide-react
2. Menambahkan import fungsi `cancelOrder` dari orderService
3. Menambahkan state `cancellingOrderId` untuk loading state
4. Menambahkan handler function `handleCancelOrder()`
5. Menambahkan UI button "Batalkan Pesanan" untuk order dengan status `pending`

**UI Button Baru:**
```tsx
{order.status === 'pending' && (
  <Button
    onClick={() => handleCancelOrder(order.OrderID)}
    disabled={cancellingOrderId === order.OrderID}
    variant="destructive"
    className="flex-1 disabled:opacity-50"
  >
    {cancellingOrderId === order.OrderID ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Membatalkan...
      </>
    ) : (
      <>
        <X className="h-4 w-4 mr-2" />
        Batalkan Pesanan
      </>
    )}
  </Button>
)}
```

**Alur Cancel Order:**
1. Customer melihat pesanan dengan status `pending` di halaman riwayat pesanan
2. Tombol "Batalkan Pesanan" (merah) muncul di samping tombol "Pesan Lagi"
3. Customer klik tombol "Batalkan Pesanan"
4. Muncul konfirmasi: "Yakin ingin membatalkan pesanan ini? Pesanan akan dihapus secara permanen."
5. Jika customer konfirmasi:
   - Memanggil API `PUT /api/v1/orders/{id}/cancel`
   - Backend menghapus order dari database
   - Frontend menghapus order dari tampilan riwayat
   - Menampilkan toast sukses: "Pesanan dibatalkan"
6. Jika gagal, menampilkan toast error dengan pesan kesalahan

**Perbedaan dengan Fitur Delete Existing:**
- 🗑️ **Tombol Delete (Trash Icon):** Menyembunyikan pesanan dari riwayat customer (soft delete dengan `hidden_from_customer = true`), data tetap ada di database, bisa untuk semua status order
- ❌ **Tombol Cancel (X Icon):** Menghapus pesanan secara permanen dari database, hanya untuk status `pending`

---

## Testing Checklist

### Dashboard Pendapatan
- [ ] Login ke admin panel
- [ ] Buka halaman dashboard
- [ ] Periksa nilai "Pendapatan Hari Ini" - harus menampilkan total order delivered hari ini dengan diskon
- [ ] Periksa nilai "Pendapatan Bulan Ini" - harus menampilkan total order delivered bulan ini dengan diskon
- [ ] Periksa nilai "Pendapatan Tahun Ini" - harus menampilkan total order delivered tahun ini dengan diskon
- [ ] Bandingkan dengan report PDF untuk memastikan nilai sama

### Fitur Cancel Order
- [ ] Login sebagai customer di web
- [ ] Buat pesanan baru (otomatis status pending)
- [ ] Buka halaman "Riwayat Pesanan"
- [ ] Pastikan tombol "Batalkan Pesanan" (merah) muncul untuk pesanan pending
- [ ] Klik tombol "Batalkan Pesanan"
- [ ] Konfirmasi pembatalan
- [ ] Pesanan harus hilang dari riwayat
- [ ] Cek database - pesanan harus terhapus dari tabel orders, order_details, dan payments
- [ ] Login ke admin panel
- [ ] Pesanan yang dibatalkan tidak muncul di daftar orders
- [ ] Coba batalkan pesanan dengan status "confirmed" - harus gagal dengan pesan error
- [ ] Coba batalkan pesanan dengan status "delivered" - tombol cancel tidak muncul

---

## Database Impact

### Orders yang dibatalkan akan:
- ✅ Terhapus dari tabel `orders`
- ✅ Terhapus dari tabel `order_details`
- ✅ Terhapus dari tabel `payments`
- ✅ Tidak muncul di admin panel
- ✅ Tidak muncul di customer history

### Data Integrity:
Menggunakan `DB::beginTransaction()` dan `DB::commit()` untuk memastikan semua penghapusan terjadi secara atomik. Jika ada error, akan di-rollback.

---

## Notes untuk Developer

### Revenue Calculation
Jika di masa depan ingin menambahkan filter atau laporan lain, gunakan `Order.total_price` untuk perhitungan pendapatan, bukan `Payment.amount`, karena:
1. `total_price` sudah include discount
2. Lebih mudah di-query tanpa join
3. Konsisten dengan data Order

### Cancel Order Limitation
Hanya status `pending` yang bisa dibatalkan karena:
- Status `confirmed` berarti admin sudah menerima dan memproses
- Status `delivered` berarti sudah selesai
- Menghapus order yang sudah diproses bisa merusak data historis dan akuntansi

Jika ingin menambahkan cancel untuk status lain, pertimbangkan:
- Membuat status refund
- Membuat sistem return/complaint
- Notification ke admin untuk persetujuan

---

## Files Modified

### Backend (Laravel/PHP)
1. `be/app/Filament/Admin/Widgets/StatsOverviewWidget.php`
   - Line 19-47: Revenue calculation methods updated

2. `be/app/Http/Controllers/Api/OrderController.php`
   - Line 254-300: `cancel()` method rewritten for permanent deletion

### Frontend (React/TypeScript)
1. `fe/src/pages/OrderHistory.tsx`
   - Line 6: Added imports (Loader2, X, cancelOrder)
   - Line 69: Added `cancellingOrderId` state
   - Line 189-220: Added `handleCancelOrder()` function
   - Line 549-570: Added conditional cancel button UI

---

## Kesimpulan

✅ **Modifikasi 1:** Dashboard pendapatan sekarang menampilkan nilai yang akurat dengan perhitungan diskon yang benar.

✅ **Modifikasi 2:** Customer dapat membatalkan pesanan pending, dan pesanan tersebut akan terhapus permanen dari database serta tidak muncul di admin panel.

✅ **Bug Fix 3:** Perbedaan harga antara cart dan checkout telah diperbaiki - sistem sekarang selalu menggunakan harga menu terkini.

---

## 🐛 Bug Fix: Perbedaan Harga Cart vs Checkout

### Masalah yang Ditemukan
User melaporkan pesanan dengan harga Rp 22.000 tercatat sebagai Rp 24.000 di dashboard admin.

### Root Cause Analysis
Terjadi inkonsistensi karena sistem menggunakan **harga terkini dari menu** saat checkout, bukan **harga snapshot saat add to cart**.

**Skenario Masalah:**
```
Hari Kemarin:
1. Menu "Ayam Kremes" harga Rp 11.000
2. Customer add to cart → cart.price = 11.000
3. Customer belum checkout

Hari Ini:
4. Admin ubah harga menu jadi Rp 12.000
5. Customer checkout → backend pakai menu.price = 12.000 ❌
6. Order tercatat Rp 12.000, padahal seharusnya Rp 11.000
7. Di dashboard admin: Rp 12.000 (SALAH - inconsistent dengan waktu pembelian)
```

### Konsep Pricing yang Benar

Sistem food delivery harus menggunakan **"Snapshot Pricing Model"**:
- ✅ Harga yang tercatat = harga pada saat customer membeli/checkout
- ✅ Jika kemarin harga Rp 11.000 dan dibeli kemarin, tercatat Rp 11.000
- ✅ Jika hari ini harga naik Rp 12.000, order kemarin tetap Rp 11.000
- ✅ Laporan pendapatan mencerminkan harga historis yang akurat

**Mengapa penting?**
1. **Akuntansi Akurat:** Pendapatan tercatat sesuai harga saat transaksi
2. **Konsistensi Data:** Order history tidak berubah jika harga menu berubah
3. **Transparansi:** Customer bayar sesuai yang ditampilkan saat beli
4. **Audit Trail:** Laporan keuangan akurat untuk periode tertentu

### Solusi Implementasi

#### 1. Cart Model (be/app/Models/Cart.php)

**Rollback ke snapshot pricing:**

```php
// Calculate subtotal using snapshot price from cart
public function getSubtotalAttribute()
{
    // Use stored price as snapshot - preserve price history
    return $this->price * $this->quantity;
}
```

**Perubahan:**
- ❌ Hapus accessor `current_price`, `discount_per_item`, `final_price`
- ✅ Gunakan `cart.price` yang tersimpan (snapshot saat add to cart)
- ✅ Subtotal = price × quantity (harga snapshot)

#### 2. CartController index() (be/app/Http/Controllers/Api/CartController.php)

**Gunakan harga snapshot:**

```php
public function index(Request $request)
{
    $cartItems = Cart::where('CustomerID', $request->user()->CustomerID)
                    ->with('menu')
                    ->get();

    // Use snapshot prices from cart
    $total = $cartItems->sum('subtotal');
    $itemCount = $cartItems->sum('quantity');

    return response()->json([
        'success' => true,
        'data' => [
            'items' => $cartItems,
            'total_price' => $total,
            'total_items' => $itemCount
        ]
    ]);
}
```

**Perubahan:**
- ❌ Tidak lagi sync dengan `menu.price` terkini
- ✅ Gunakan `cart.price` (harga saat item ditambahkan)
- ✅ Total dihitung dari harga snapshot

#### 3. CartController checkout() (be/app/Http/Controllers/Api/CartController.php)

**CRITICAL FIX - Gunakan cart price, bukan menu price:**

```php
$itemsData = $cartItems->map(function ($cartItem) use (&$totalOriginal, &$totalDiscount) {
    // Use snapshot price from cart (price at time of adding to cart)
    // This ensures order reflects the price when customer added item
    $originalPrice = $cartItem->price;  // ✅ DARI CART, BUKAN MENU!
    $promo = $cartItem->menu->activePromo;
    $discountPerItem = $promo ? $promo->calculateDiscount($originalPrice) : 0;
    $discountedPrice = max(0, $originalPrice - $discountPerItem);

    $totalOriginal += $originalPrice * $cartItem->quantity;
    $totalDiscount += $discountPerItem * $cartItem->quantity;

    return [
        'cartItem'       => $cartItem,
        'originalPrice'  => $originalPrice,    // Snapshot price
        'discountPerItem'=> $discountPerItem,
        'discountedPrice'=> $discountedPrice,
    ];
});
```

**Perubahan:**
- ❌ SEBELUM: `$originalPrice = $cartItem->menu->price;` (harga terkini)
- ✅ SESUDAH: `$originalPrice = $cartItem->price;` (harga snapshot)
- ✅ Order akan menyimpan harga pada saat pembelian

### Alur Data Lengkap

**1. Add to Cart:**
```php
Cart::create([
    'CustomerID' => $customerID,
    'MenuID' => $menuId,
    'quantity' => $quantity,
    'price' => $menu->price,  // Snapshot disimpan di sini
]);
```

**2. View Cart:**
```php
// Tampilkan harga dari cart.price (snapshot)
$total = $cartItems->sum('subtotal');
// subtotal = cart.price × quantity
```

**3. Checkout:**
```php
// Gunakan cart.price untuk order
$originalPrice = $cartItem->price;  // Snapshot!

// Simpan ke order_details
OrderDetail::create([
    'OrderID' => $order->OrderID,
    'MenuID' => $cartItem->MenuID,
    'menu_name' => $cartItem->menu->name,
    'quantity' => $cartItem->quantity,
    'price' => $discountedPrice,        // Harga setelah diskon
    'original_price' => $originalPrice,  // Snapshot sebelum diskon
    'discount_per_item' => $discountPerItem,
]);

// Simpan ke orders
Order::create([
    'total_price' => $totalPrice,      // Total dari snapshot prices
    'discount_amount' => $totalDiscount,
]);
```

**4. Dashboard Admin:**
```php
// Pendapatan menggunakan order.total_price (sudah fixed/snapshot)
$revenue = Order::where('status', 'delivered')
    ->sum('total_price');
```

### Hasil Perbaikan

**Skenario Test:**

**Kemarin (8 Maret):**
- Harga Ayam Kremes: Rp 11.000
- Customer add to cart
- Customer checkout
- ✅ Order tercatat: Rp 11.000

**Hari Ini (9 Maret):**
- Admin ubah harga Ayam Kremes jadi Rp 12.000
- Customer baru add to cart
- Customer baru checkout
- ✅ Order tercatat: Rp 12.000

**Dashboard Admin:**
- Order 8 Maret: Rp 11.000 ✅
- Order 9 Maret: Rp 12.000 ✅
- Total pendapatan akurat sesuai harga saat pembelian

**Export PDF Report:**
- Menampilkan harga historis yang benar
- Tidak terpengaruh perubahan harga menu

### Perbandingan: Before vs After

| Aspek | ❌ Before (Bug) | ✅ After (Fixed) |
|-------|----------------|------------------|
| Add to Cart | Simpan Rp 11.000 | Simpan Rp 11.000 |
| Admin ubah harga | Menu jadi Rp 12.000 | Menu jadi Rp 12.000 |
| Checkout | Pakai Rp 12.000 (ERROR!) | Pakai Rp 11.000 (BENAR!) |
| Dashboard | Rp 12.000 (SALAH) | Rp 11.000 (BENAR) |
| Report PDF | Rp 12.000 (SALAH) | Rp 11.000 (BENAR) |
| Konsistensi | ❌ Tidak konsisten | ✅ Konsisten |

### Files Modified

1. **be/app/Models/Cart.php**
   - Rollback accessor `getSubtotalAttribute()` ke gunakan `cart.price`
   - Hapus accessor tidak perlu: `current_price`, `discount_per_item`, `final_price`

2. **be/app/Http/Controllers/Api/CartController.php**
   - Method `index()`: Gunakan `cart.price`, tidak sync dengan `menu.price`
   - Method `checkout()`: **CRITICAL FIX** - Gunakan `$cartItem->price` bukan `$cartItem->menu->price`

3. **be/app/Http/Controllers/Api/OrderController.php** ⭐ NEW FIX
   - Method `store()`: **CRITICAL FIX** - Menambahkan perhitungan diskon untuk direct order
   - Sebelumnya: Langsung pakai `menu.price` tanpa diskon
   - Sesudah: Menghitung `discountPerItem` dan `discountedPrice` seperti di CartController
   - Menyimpan `original_price`, `discount_per_item` di OrderDetail
   - Menyimpan `discount_amount` di Order

### Bug yang Diperbaiki di OrderController

**Masalah:**
Direct order (lewat API `/orders` POST) tidak menghitung diskon, sehingga:
- Customer beli menu Rp 12.500 dengan diskon jadi Rp 10.500
- Order tercatat Rp 12.500 (harga asli tanpa diskon) ❌
- Dashboard pendapatan salah

**Penyebab:**
Ada 2 cara create order:
1. Via Cart Checkout (CartController) - ✅ Sudah menghitung diskon
2. Via Direct Order (OrderController) - ❌ Tidak menghitung diskon

**Solusi:**
Menambahkan perhitungan diskon di OrderController.store():

```php
// Before (SALAH)
$itemTotal = $menu->price * $item['quantity'];
$totalPrice += $itemTotal;

// After (BENAR)
$originalPrice = $menu->price;
$promo = $menu->activePromo;
$discountPerItem = $promo ? $promo->calculateDiscount($originalPrice) : 0;
$discountedPrice = max(0, $originalPrice - $discountPerItem);

$quantity = $item['quantity'];
$itemTotal = $discountedPrice * $quantity;

$totalOriginal += $originalPrice * $quantity;
$totalDiscount += $discountPerItem * $quantity;
$totalPrice += $itemTotal;
```

Dan menyimpan data diskon ke OrderDetail:

```php
// Before (SALAH)
OrderDetail::create([
    'OrderID' => $order->OrderID,
    'MenuID' => $item['menu']->MenuID,
    'quantity' => $item['quantity'],
    'price' => $item['price'],  // Harga tanpa diskon
    'selected_variant' => $item['selected_variant'],
]);

// After (BENAR)
OrderDetail::create([
    'OrderID' => $order->OrderID,
    'MenuID' => $item['menu']->MenuID,
    'menu_name' => $item['menu']->name,
    'quantity' => $item['quantity'],
    'price' => $item['discountedPrice'],        // Harga setelah diskon
    'original_price' => $item['originalPrice'],  // Harga asli
    'discount_per_item' => $item['discountPerItem'], // Diskon per item
    'selected_variant' => $item['selected_variant'],
]);
```

**Hasil:**
- ✅ Direct order sekarang menghitung diskon dengan benar
- ✅ Order Rp 12.500 dengan diskon menjadi Rp 10.500 tercatat sebagai Rp 10.500
- ✅ Dashboard pendapatan akurat

---

## Testing Checklist

**Kapan Harga Disimpan:**
- ✅ Saat add to cart → `cart.price` = snapshot harga menu saat itu
- ✅ Saat checkout → `order_details.original_price` = dari `cart.price`
- ✅ Harga di order TIDAK berubah meskipun harga menu berubah

**Benefit Snapshot Pricing:**
1. ✅ Akuntansi akurat per periode
2. ✅ Customer tidak kena surprise price
3. ✅ Laporan keuangan konsisten
4. ✅ Audit trail jelas
5. ✅ Tidak ada data inconsistency

**Edge Case: Menu yang Sudah Dikasi Diskon:**
- Diskon dihitung dari `cart.price` (bukan `menu.price`)
- Jadi kalau menu naik harga, diskon tetap dihitung dari harga lama
- Ini BENAR karena customer berhak dapat harga saat mereka add to cart

---

## Kesimpulan

✅ **Modifikasi 1:** Dashboard pendapatan sekarang menampilkan nilai yang akurat dengan perhitungan diskon yang benar.

✅ **Modifikasi 2:** Customer dapat membatalkan pesanan pending, dan pesanan tersebut akan terhapus permanen dari database serta tidak muncul di admin panel.

✅ **Bug Fix 3:** Sistem sekarang menggunakan **Snapshot Pricing Model** - harga tercatat sesuai pada saat pembelian, bukan harga terkini menu. Ini memastikan konsistensi data historis dan akurasi laporan keuangan.

✅ **Bug Fix 4:** Direct order (OrderController.store()) sekarang menghitung diskon dengan benar, sama seperti cart checkout. Pendapatan di dashboard admin sekarang akurat mencerminkan harga setelah diskon.

Semua fitur dan perbaikan sudah siap digunakan!
