# MIDTRANS PAYMENT GATEWAY SETUP GUIDE

## 📋 Overview
Panduan lengkap untuk mengintegrasikan Midtrans payment gateway ke project PSAJ_fooddelivery. Setelah setup ini, customer dapat membayar pesanan menggunakan berbagai metode pembayaran:
- **E-Wallet**: GoPay, OVO, DANA, ShopeePay, LinkAja
- **Bank Transfer**: Virtual Account BCA, BNI, BRI, Mandiri
- **QR Code**: QRIS
- **Offline**: Cash on Delivery (COD)

---

## 🔧 Step 1: Konfigurasi Environment Variables

### Backend (.env)
Tambahkan Midtrans configuration ke file `.env`:

```env
# Midtrans Payment Gateway
MIDTRANS_SERVER_KEY=your_midtrans_server_key_here
MIDTRANS_CLIENT_KEY=your_midtrans_client_key_here
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true

# Frontend URL (untuk payment callbacks)
FRONTEND_URL=http://localhost:5173
```

### Cara Mendapatkan Keys dari Midtrans:
1. Login ke dashboard Midtrans: https://dashboard.midtrans.com
2. Untuk sandbox: https://app.sandbox.midtrans.com
3. Atau untuk production: https://app.midtrans.com
4. Navigasi ke: **Settings** → **API Keys**
5. Copy **Server Key** dan **Client Key**
6. Paste ke file `.env`

**Catatan**: 
- Gunakan `MIDTRANS_IS_PRODUCTION=false` untuk testing/development
- Gunakan `MIDTRANS_IS_PRODUCTION=true` untuk production dengan production API keys

---

## 📦 Step 2: Backend Setup (Laravel)

### 2.1. Install Midtrans PHP Package
Package sudah diinstall melalui composer, tetapi jika belum:

```bash
cd be
composer require midtrans/midtrans-php
```

### 2.2. Verify Configuration
Pastikan file `be/config/services.php` sudah memiliki Midtrans config:

```php
'midtrans' => [
    'server_key'        => env('MIDTRANS_SERVER_KEY', ''),
    'client_key'        => env('MIDTRANS_CLIENT_KEY', ''),
    'is_production'     => env('MIDTRANS_IS_PRODUCTION', false),
    'is_sanitized'      => env('MIDTRANS_IS_SANITIZED', true),
    'is_3ds'            => env('MIDTRANS_IS_3DS', true),
    'snap_url'          => env('MIDTRANS_IS_PRODUCTION', false)
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js',
],
```

### 2.3. Verify MidtransService
File `be/app/Services/MidtransService.php` sudah tersedia dengan methods:
- `createSnapTransaction()` - Create Snap transaction untuk payment
- `handleNotification()` - Handle webhook dari Midtrans
- `mapMidtransStatus()` - Map status dari Midtrans ke app status

### 2.4. Verify Payment Model
File `be/app/Models/Payment.php` sudah memiliki:
- Fields untuk Snap data: `snap_token`, `midtrans_order_id`, `redirect_url`
- Payment method constants
- Payment status constants

### 2.5. Verify API Routes
Routes sudah dikonfigurasi di `be/routes/api.php`:

```php
// Public: Get payment methods
Route::get('/payment-methods', [PaymentController::class, 'getPaymentMethods']);

// Public: Midtrans webhook notification
Route::post('/payment/notification', [PaymentController::class, 'handleNotification']);

// Protected: Create Snap transaction
Route::post('/payment/snap/create', [PaymentController::class, 'createSnapTransaction']);

// Admin: Update payment status
Route::put('/admin/payments/{id}/status', [PaymentController::class, 'updateStatus']);
```

### 2.6. Enable CSRF Exception untuk Webhook
File `be/app/Http/Middleware/VerifyCsrfToken.php` sudah dikonfigurasi untuk exclude webhook route:

```php
protected $except = [
    'api/v1/payment/notification',
];
```

---

## 🎨 Step 3: Frontend Setup (React)

### 3.1. Payment Service
File `fe/src/services/paymentService.ts` sudah tersedia dengan functions:
- `getPaymentMethods()` - Ambil daftar metode pembayaran
- `createSnapTransaction()` - Buat Snap transaction
- `initializeMidtransSnap()` - Initialize Snap.js library
- `openMidtransPayment()` - Open payment modal
- `checkPaymentStatus()` - Check payment status

### 3.2. Payment Modal Component
File `fe/src/components/PaymentModal.tsx` sudah tersedia:
- Display metode pembayaran dan total
- Integrate dengan Midtrans Snap.js
- Handle payment flow

### 3.3. Payment Result Pages
Tiga halaman sudah dibuat untuk handle payment results:

#### Payment Finish (`fe/src/pages/PaymentFinish.tsx`)
- Ditampilkan saat payment successful
- Redirect ke halaman ini setelah successful payment

#### Payment Pending (`fe/src/pages/PaymentPending.tsx`)
- Ditampilkan saat payment pending (e.g., virtual account transfer)
- User harus menunggu konfirmasi bank

#### Payment Error (`fe/src/pages/PaymentError.tsx`)
- Ditampilkan saat payment gagal
- User bisa retry atau back

### 3.4. Update Routes (App.tsx)
Routes sudah ditambahkan:

```tsx
<Route path="/payment/finish" element={<PaymentFinish />} />
<Route path="/payment/pending" element={<PaymentPending />} />
<Route path="/payment/error" element={<PaymentError />} />
```

### 3.5. Update OrderHistory.tsx
OrderHistory sudah terintegrasi dengan:
- Load payment methods on mount
- Show "Bayar Sekarang" button untuk unpaid orders
- Open payment modal when user clicks payment button
- Handle payment flow via Midtrans Snap

---

## 🔐 Step 4: Database Migrations

Pastikan migration untuk Payment model sudah dijalankan:

```bash
cd be
php artisan migrate
```

**Payment table fields yang diperlukan:**
- `PaymentID` (primary key)
- `OrderID` (foreign key)
- `payment_method` (enum)
- `payment_status` (enum: pending, waiting_payment, paid, failed, etc)
- `amount` (decimal)
- `paid_at` (timestamp nullable)
- `snap_token` (string nullable) - Midtrans Snap token
- `midtrans_order_id` (string nullable) - Midtrans order ID
- `redirect_url` (text nullable) - Payment page redirect URL
- `payment_reference` (string nullable) - Transaction ID dari payment gateway
- `payment_details` (json nullable) - Detail data dari payment gateway
- `notes` (text nullable)

---

## 🧪 Step 5: Testing Payment Gateway

### 5.1. Start Development Servers

**Backend:**
```bash
cd be
php artisan serve
```

**Frontend:**
```bash
cd fe
npm run dev
```

### 5.2. Test in Sandbox Mode
1. Login ke aplikasi
2. Checkout order dengan payment method selain COD
3. Click "Bayar Sekarang" button
4. Payment modal akan terbuka
5. Tentukan metode pembayaran (GoPay, QRIS, VA, dll)
6. Ikuti instruksi pembayaran

### 5.3. Sandbox Testing Credentials

**GoPay (Wallet Testing):**
- Gunakan test numbers yang disediakan Midtrans di dashboard

**Virtual Account Testing:**
- Setiap VA memiliki test account di Midtrans dashboard
- Transfer dengan jumlah yang sesuai untuk test

**Credit Card Testing:**
- **Success**: 4111 1111 1111 1111, any future date, any CVV
- **Decline**: 4000 0000 0000 0002

Lihat: https://docs.midtrans.com/en/technical-reference/sandbox-test-credentials

### 5.4. Webhook Testing

Untuk test webhook notification, gunakan Midtrans Testing Tool atau postman:

```bash
POST /api/v1/payment/notification
Content-Type: application/json

{
  "order_id": "ORDER-123-1234567890",
  "status_code": "200",
  "gross_amount": "50000.00",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "payment_type": "gopay",
  "transaction_id": "TXN123456789",
  "signature_key": "calculated_signature"
}
```

---

## 📊 Payment Flow Diagram

```
┌─────────────────┐
│  Order Created  │
└────────┬────────┘
         │ payment_status = 'pending'
         │
    ┌────▼────────────────┐
    │  Customer clicks    │
    │  "Bayar Sekarang"   │
    └────┬────────────────┘
         │
    ┌────▼──────────────────────┐
    │ createSnapTransaction()    │
    │ (Backend API)              │
    └────┬──────────────────────┘
         │ Returns snap_token
         │
    ┌────▼──────────────────────┐
    │ initializeMidtransSnap()   │
    │ (Frontend)                 │
    └────┬──────────────────────┘
         │ Load Snap.js library
         │
    ┌────▼──────────────────────┐
    │ openMidtransPayment()      │
    │ (Open payment modal)       │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Customer pays              │
    │ (via GoPay, QRIS, etc)     │
    └────┬──────────────────────┘
         │
    ┌────▼──────────────────────┐
    │ Midtrans Webhook           │
    │ handleNotification()        │
    │ (Backend)                  │
    └────┬──────────────────────┘
         │ payment_status = 'paid'
         │ order status = 'confirmed'
         │
    ┌────▼──────────────────────┐
    │ Payment Success/Pending    │
    │ (Result Pages)             │
    └────────────────────────────┘
```

---

## 🛡️ Security Checklist

- [ ] Use HTTPS in production
- [ ] Keep Midtrans Server Key secret (never expose in frontend)
- [ ] Verify webhook signature on backend (already done in `handleNotification()`)
- [ ] Set CSRF exception for webhook endpoint (already done)
- [ ] Use production API keys and `MIDTRANS_IS_PRODUCTION=true` for live customers
- [ ] Implement rate limiting for payment endpoints
- [ ] Log all payments transactions for audit
- [ ] Never store complete credit card info on server

---

## 🔗 API Reference

### Get Payment Methods
```
GET /api/v1/payment-methods
```
**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "gopay",
      "name": "GoPay",
      "description": "Bayar dengan GoPay",
      "type": "ewallet",
      "use_midtrans": true,
      "icon": "gopay"
    }
    // ... more methods
  ],
  "midtrans": {
    "client_key": "YOUR_CLIENT_KEY",
    "snap_url": "https://app.sandbox.midtrans.com/snap/snap.js"
  }
}
```

### Create Snap Transaction
```
POST /api/v1/payment/snap/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "order_id": 123
}
```
**Response:**
```json
{
  "success": true,
  "message": "Snap transaction created",
  "data": {
    "snap_token": "SNAP_TOKEN",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v2/vtweb/...",
    "midtrans_order_id": "ORDER-123-1234567890",
    "client_key": "YOUR_CLIENT_KEY",
    "snap_js_url": "https://app.sandbox.midtrans.com/snap/snap.js",
    "payment_id": 456
  }
}
```

### Payment Notification Webhook
```
POST /api/v1/payment/notification
Content-Type: application/json

{
  "order_id": "ORDER-123-1234567890",
  "status_code": "200",
  "gross_amount": "50000.00",
  "transaction_status": "settlement",
  "fraud_status": "accept",
  "payment_type": "gopay",
  "transaction_id": "TXN123456789",
  "signature_key": "calculated_signature"
}
```

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue: "Invalid signature" error**
- Pastikan `MIDTRANS_SERVER_KEY` sudah benar
- Pastikan environment production setting sesuai

**Issue: "Client key not found"**
- Pastikan `MIDTRANS_CLIENT_KEY` sudah diset di `.env`
- Restart frontend development server

**Issue: Payment modal tidak appear**
- Check browser console untuk error message
- Pastikan Snap.js library loaded (check Network tab)
- Pastikan `snap_token` valid dari backend response

**Issue: Webhook tidak diterima**
- Verify webhook URL di Midtrans dashboard settings
- Check server logs untuk webhook request
- Pastikan CSRF exception sudah dikonfigurasi
- Test dengan Midtrans Testing Tool

### Debug Mode
Tambah logging di `.env`:
```env
LOG_CHANNEL=single
LOG_LEVEL=debug
```

Lihat logs di `be/storage/logs/`

---

## 📚 Additional Resources

- **Midtrans Documentation**: https://docs.midtrans.com
- **Midtrans Snap.js**: https://docs.midtrans.com/en/snap/snap-advanced
- **Test Credentials**: https://docs.midtrans.com/en/technical-reference/sandbox-test-credentials
- **Status Reference**: https://docs.midtrans.com/en/reference/transaction-status-cycle
- **API Reference**: https://docs.midtrans.com/en/api-reference/api-overview

---

## ✅ Setup Verification Checklist

Sebelum go-live, pastikan:

- [ ] Semua payment methods sudah tested
- [ ] Webhook notification bekerja dengan baik
- [ ] Payment status terupdate otomatis
- [ ] Order status berubah ke "confirmed" saat pembayaran sukses
- [ ] Customer notifikasi dikirim setelah payment sukses
- [ ] Admin dapat melihat payment details di dashboard
- [ ] Refund flow sudah ditest (jika diperlukan)
- [ ] Error handling sudah comprehensive
- [ ] Logging dan monitoring sudah setup
- [ ] Production API keys dan configuration sudah siap

---

## 🚀 Deployment Checklist

Sebelum deployment ke production:

1. **Update Environment Variables**
   - Ganti `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` dengan production keys
   - Set `MIDTRANS_IS_PRODUCTION=true`
   - Update `FRONTEND_URL` ke production domain

2. **Database**
   - Run migrations di production server
   - Backup existing data

3. **Payment Testing**
   - Test dengan metode pembayaran real
   - Verify webhook configuration di Midtrans dashboard
   - Test refund process (jika applicable)

4. **Monitoring**
   - Setup payment alerts
   - Monitor failed transactions
   - Setup webhook retry mechanism

---

Dokumentasi ini akan terus diupdate sekiranya ada perubahan atau improvement.
Untuk pertanyaan atau issue, hubungi tim development.
