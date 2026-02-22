# Warung Edin - Laravel Backend API

## Deskripsi
Backend API untuk sistem food delivery "Warung Edin" menggunakan Laravel 11 dengan Filament Admin Panel.

## Teknologi
- **Backend**: Laravel 11
- **Database**: MySQL
- **Admin Panel**: Filament
- **Authentication**: Laravel Sanctum
- **Server**: PHP 8.3

## Setup & Installation

### Prerequisites
- PHP 8.3+
- MySQL 8.0+
- Composer

### Installasi
1. Install dependencies:
   ```bash
   composer install
   ```

2. Setup environment:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

3. Konfigurasi database di `.env`:
   ```
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=warung_edin
   DB_USERNAME=root
   DB_PASSWORD=
   ```

4. Jalankan migrations dan seeders:
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

5. Jalankan server:
   ```bash
   php artisan serve
   ```

## Database Schema

### Tables:
- **admins**: Data admin warung
- **customers**: Data pelanggan
- **menus**: Menu makanan/minuman
- **orders**: Data pesanan
- **order_details**: Detail item pesanan
- **payments**: Data pembayaran

### Relationships:
- Admin hasMany Menu
- Customer hasMany Order
- Order hasMany OrderDetail
- Order hasOne Payment
- Menu hasMany OrderDetail

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Endpoints

#### Customer Registration
```
POST /customers/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com", 
    "phone": "+6281234567890",
    "address": "Jl. Contoh No. 123",
    "password": "password123",
    "password_confirmation": "password123"
}
```

#### Customer Login
```
POST /customers/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

#### Admin Login
```
POST /admin/login
Content-Type: application/json

{
    "email": "admin@warungedin.com",
    "password": "password123"
}
```

### Menu Endpoints

#### Get All Menus
```
GET /menus?category=main_course&search=nasi&per_page=10
```

#### Get Menu by ID
```
GET /menus/{id}
```

#### Get Menus by Category
```
GET /menus/category/{category}
```

### Customer Protected Endpoints
**Header required**: `Authorization: Bearer {token}`

#### Get Customer Profile
```
GET /customer/profile
```

#### Update Customer Profile
```
PUT /customer/profile
Content-Type: application/json

{
    "name": "John Doe Updated",
    "phone": "+6281234567890",
    "address": "New address"
}
```

#### Create Order
```
POST /orders
Content-Type: application/json

{
    "items": [
        {
            "menu_id": 1,
            "quantity": 2
        },
        {
            "menu_id": 3, 
            "quantity": 1
        }
    ],
    "payment_method": "cash"
}
```

#### Get Customer Orders
```
GET /orders?per_page=10
```

#### Cancel Order
```
PUT /orders/{id}/cancel
```

### Admin Protected Endpoints
**Header required**: `Authorization: Bearer {admin_token}`

#### Get All Orders
```
GET /admin/orders?status=pending&per_page=10
```

#### Update Order Status
```
PUT /admin/orders/{id}/status
Content-Type: application/json

{
    "status": "confirmed"
}
```

### Admin User Management Endpoints
**Header required**: `Authorization: Bearer {admin_token}`

#### Get All Users
```
GET /admin/users?search=john&verified=true&per_page=10
```

#### Create New User
```
POST /admin/users
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+6281234567890", 
    "address": "Jl. Contoh No. 123",
    "password": "password123",
    "password_confirmation": "password123"
}
```

#### Get User by ID
```
GET /admin/users/{id}
```

#### Update User
```
PUT /admin/users/{id}
Content-Type: application/json

{
    "name": "John Doe Updated",
    "email": "john.updated@example.com",
    "phone": "+6281234567890",
    "address": "New Address", 
    "password": "newpassword123",
    "password_confirmation": "newpassword123"
}
```

#### Delete User
```
DELETE /admin/users/{id}
```

#### Toggle User Email Verification
```
POST /admin/users/{id}/toggle-verification
```

#### Get User Statistics
```
GET /admin/users-statistics
```

## Response Format

### Success Response
```json
{
    "success": true,
    "message": "Operation successful",
    "data": {...}
}
```

### Error Response
```json
{
    "success": false,
    "message": "Error message",
    "errors": {...}
}
```

## Admin Panel

### URL
```
http://localhost:8000/admin
```

### Default Admin Credentials
- **Email**: admin@warungedin.com
- **Password**: password123

### Features:
- Menu management (CRUD)
- Order management 
- Customer management
- Payment tracking
- Dashboard analytics

## Sample Data

### Admin Account:
- **Name**: Admin Warung Edin
- **Email**: admin@warungedin.com
- **Password**: password123

### Sample Menus:
1. Nasi Gudeg - Rp 15.000
2. Soto Ayam - Rp 12.000
3. Es Teh Manis - Rp 3.000
4. Gado-Gado - Rp 10.000
5. Pisang Goreng - Rp 8.000

## Order Status Flow
1. **pending** - Order baru dibuat
2. **confirmed** - Order dikonfirmasi admin
3. **preparing** - Sedang dipersiapkan
4. **ready** - Siap untuk pickup/delivery
5. **delivered** - Sudah diterima customer
6. **cancelled** - Order dibatalkan

## Payment Methods
- cash (Tunai)
- transfer (Transfer Bank)
- e-wallet (E-Wallet)
- credit_card (Kartu Kredit)

## Payment Status
- pending - Belum dibayar
- paid - Sudah dibayar
- failed - Pembayaran gagal
- refunded - Sudah direfund

## Testing

### Menggunakan Postman/Thunder Client
1. Import collection dari dokumentasi ini
2. Set environment variable untuk base URL
3. Test authentication endpoints dulu
4. Simpan token dari response login
5. Test protected endpoints dengan token

### Contoh Testing Flow:
1. Register customer baru
2. Login customer → dapatkan token
3. Browse menu
4. Create order
5. Admin login → dapatkan admin token
6. Admin lihat orders
7. Admin update status order

## Deployment Notes
- Pastikan PHP extensions yang dibutuhkan tersedia (zip, etc.)
- Set APP_ENV=production untuk production
- Konfigurasi database production
- Set APP_DEBUG=false untuk production
- Generate application key untuk production
- Optimize autoloader: `composer install --optimize-autoloader`

## Support
Untuk pertanyaan dan dukungan, hubungi tim development.