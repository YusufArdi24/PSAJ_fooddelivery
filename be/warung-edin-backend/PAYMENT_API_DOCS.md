# Payment Methods API Documentation

## Metode Pembayaran yang Tersedia

### Cash & COD
- **cash**: Bayar tunai langsung
- **cod**: Cash on Delivery - bayar saat pesanan diterima

### E-Wallet
- **gopay**: GoPay
- **dana**: DANA
- **ovo**: OVO
- **linkaja**: LinkAja 
- **shopeepay**: ShopeePay

### Bank Transfer
- **transfer**: Transfer bank umum
- **bca**: Bank Central Asia
- **mandiri**: Bank Mandiri
- **bni**: Bank Negara Indonesia
- **bri**: Bank Rakyat Indonesia

### QR Code
- **qris**: QRIS (Quick Response Indonesian Standard)

## API Endpoints

### 1. Get Payment Methods
```
GET /api/v1/payment-methods
```
**Response:**
```json
{
  "success": true,
  "data": {
    "cash": {
      "name": "Cash",
      "description": "Bayar tunai saat pesanan diantar",
      "type": "offline"
    },
    "gopay": {
      "name": "GoPay", 
      "description": "Bayar dengan GoPay",
      "type": "ewallet"
    }
    // ... metode lainnya
  }
}
```

### 2. Create Order with Payment Details
```
POST /api/v1/cart/checkout
POST /api/v1/orders
```
**Request Body:**
```json
{
  "payment_method": "gopay",
  "payment_details": {
    "phone": "08123456789",
    "account_name": "John Doe"
  },
  "notes": "Bayar via GoPay atas nama John Doe"
}
```

### 3. Update Payment Status (Admin Only)
```
PUT /api/v1/admin/payments/{id}/status
```
**Request Body:**
```json
{
  "payment_status": "paid",
  "payment_reference": "TXN123456789",
  "notes": "Pembayaran berhasil dikonfirmasi"
}
```

## Payment Status Flow

1. **pending**: Status awal untuk cash/cod
2. **waiting_payment**: Status awal untuk pembayaran online
3. **paid**: Pembayaran berhasil dikonfirmasi
4. **failed**: Pembayaran gagal
5. **cancelled**: Pembayaran dibatalkan
6. **expired**: Pembayaran kedaluwarsa

## Payment Details Structure

Untuk setiap metode pembayaran, `payment_details` dapat berisi:

### E-Wallet (GoPay, DANA, OVO, dll)
```json
{
  "phone": "08123456789",
  "account_name": "Nama Pemilik",
  "transaction_id": "TXN123456"
}
```

### Bank Transfer
```json
{
  "bank_name": "BCA",
  "account_number": "1234567890",
  "account_name": "Nama Pemilik",
  "transfer_proof": "url_to_image"
}
```

### QRIS
```json
{
  "merchant_id": "ID12345",
  "qr_string": "00020101021226...",
  "transaction_id": "QR123456789"
}
```

## Example Usage

### Checkout dengan GoPay
```bash
curl -X POST http://localhost:8000/api/v1/cart/checkout \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_method": "gopay",
    "payment_details": {
      "phone": "08123456789",
      "account_name": "John Doe"
    },
    "notes": "Pembayaran untuk order makanan"
  }'
```

### Konfirmasi Pembayaran (Admin)
```bash
curl -X PUT http://localhost:8000/api/v1/admin/payments/1/status \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_status": "paid",
    "payment_reference": "GP123456789",
    "notes": "Pembayaran GoPay berhasil"
  }'
```