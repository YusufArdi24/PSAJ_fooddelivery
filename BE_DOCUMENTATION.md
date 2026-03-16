# Dokumentasi Backend (BE) - PSAJ Food Delivery

## 📁 Struktur Folder Backend

Backend dibangun menggunakan **Laravel 11** dengan PHP sebagai bahasa pemrograman.

---

## 📂 Direktori Utama

### 1. **app/** - Source Code Aplikasi

#### **app/Models/** - Database Models (ORM Eloquent)
Folder berisi model yang merepresentasikan tabel database dan relasi antarnya.

| File | Fungsi |
|------|--------|
| `User.php` | Model untuk pengguna (admin & customer) |
| `Admin.php` | Model khusus untuk admin |
| `Customer.php` | Model khusus untuk customer |
| `Menu.php` | Model untuk menu/produk makanan |
| `Order.php` | Model untuk pesanan |
| `OrderDetail.php` | Model untuk detail item dalam pesanan |
| `Cart.php` | Model untuk keranjang belanja |
| `Payment.php` | Model untuk transaksi pembayaran |
| `Notification.php` | Model untuk notifikasi customer |
| `AdminNotification.php` | Model untuk notifikasi admin |
| `Promo.php` | Model untuk program promosi/diskon |
| `PushSubscription.php` | Model untuk push notification subscriptions |
| `AdminPushSubscription.php` | Model untuk push subscription admin |
| `PendingRegistration.php` | Model untuk data registrasi yang belum terverifikasi |

---

#### **app/Http/Controllers/** - Controller (Request Handler)
Folder berisi controller yang menangani request HTTP dan mengembalikan response.

**Struktur:**

```
Controllers/
├── Controller.php (Base Controller)
├── Api/ (REST API Controllers)
│   └── [API Endpoint Controllers]
└── Admin/ (Admin Panel Controllers)
    └── [Admin Portal Controllers]
```

**Api Controllers** - Menangani REST API untuk aplikasi mobile/web customer
- AuthController - Autentikasi (login, signup, verify email)
- MenuController - Menu CRUD dan recommendations
- OrderController - Order management
- CartController - Keranjang belanja
- PaymentController - Integrasi Midtrans
- NotificationController - Notifikasi customer
- CustomerController - Profile customer
- Dll

**Admin Controllers** - Menangani admin panel
- AdminNotificationController - Notifikasi admin
- AdminPushSubscriptionController - Push subscriptions management

---

#### **app/Services/** - Business Logic Layer
Folder berisi service classes untuk business logic yang kompleks.

| File | Fungsi |
|------|--------|
| `MidtransService.php` | Service untuk integrasi Midtrans payment gateway - create transaction, verify payment, status check |
| `PushNotificationService.php` | Service untuk mengirim push notifications ke customers - trigger berdasarkan order status, menu updates |
| `WebPushService.php` | Service untuk Web Push API - subscribe, unsubscribe, send notifications |

---

#### **app/Notifications/** - Notification Classes
Folder berisi class untuk notification templates (email, push, dll).

| File | Fungsi |
|------|--------|
| `CustomerVerifyEmail.php` | Template notifikasi email verifikasi untuk customer |
| `CustomerResetPassword.php` | Template notifikasi email reset password untuk customer |
| `AdminVerifyEmail.php` | Template notifikasi email verifikasi untuk admin |

---

#### **app/Mail/** - Mailable Classes
Folder berisi class untuk email templates.

---

#### **app/Observers/** - Model Observers
Folder berisi observer untuk mendengarkan lifecycle events dari model (created, updated, deleted, dll).

Contoh: Ketika Order dibuat, observer bisa otomatis mengirim notification.

---

#### **app/Console/** - Console Commands
Folder berisi custom Artisan commands untuk task-task background atau CLI.

Contoh: Command untuk cleanup expired tokens, sync data, dll.

---

#### **app/Livewire/** - Livewire Components (Optional)
Folder berisi Livewire components jika menggunakan Livewire untuk realtime updates.

---

#### **app/Filament/** - Filament Admin Panel (Optional)
Folder berisi konfigurasi untuk Filament admin panel - resources, pages, tables, fields.

---

#### **app/Providers/** - Service Providers
Folder berisi providers untuk bootstrap aplikasi dan register services.

| Contoh | Fungsi |
|--------|--------|
| `AppServiceProvider.php` | Register custom services, boot aplikasi |
| `AuthServiceProvider.php` | Register authorization policies |
| `RouteServiceProvider.php` | Define route groups dan namespaces |

---

### 2. **routes/** - Route Definitions

| File | Fungsi |
|------|--------|
| `api.php` | Definisi REST API routes (prefix /api) - untuk customer app |
| `web.php` | Definisi web routes (admin panel, view pages) |
| `console.php` | Definisi console/CLI command routes |

**Contoh struktur api.php:**
```php
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('signup', [AuthController::class, 'signup']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('menus', [MenuController::class, 'index']);
    Route::post('orders', [OrderController::class, 'store']);
    // Protected routes
});
```

---

### 3. **database/** - Database Related

#### **database/migrations/** - Schema Definitions
File untuk membuat/memodifikasi tabel database.

| Contoh | Fungsi |
|--------|--------|
| `create_users_table` | Create tabel users |
| `create_menus_table` | Create tabel menus |
| `create_orders_table` | Create tabel orders |
| `create_payments_table` | Create tabel payments |
| `create_notifications_table` | Create tabel notifications |
| Dll | |

**Pattern:**
```php
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('email')->unique();
    $table->string('password');
    $table->timestamps();
});
```

---

#### **database/seeders/** - Data Seeding
File untuk populate database dengan data dummy/initial.

| Contoh | Fungsi |
|--------|--------|
| `DatabaseSeeder.php` | Main seeder - memanggil seeders lain |
| `UserSeeder.php` | Seed users (admin, customer) |
| `MenuSeeder.php` | Seed menu items |
| Dll | |

---

### 4. **config/** - Configuration Files

| File | Fungsi |
|------|--------|
| `app.php` | Configurasi aplikasi (timezone, name, providers) |
| `database.php` | Configurasi database connections |
| `mail.php` | Configurasi email driver & settings |
| `auth.php` | Configurasi authentication guards & providers |
| `filesystems.php` | Configurasi file storage (local, s3, dll) |
| `cache.php` | Configurasi cache driver |
| `queue.php` | Configurasi queue driver untuk jobs |
| `logging.php` | Configurasi logging |
| `services.php` | APIKeys dan credentials untuk third-party services (Midtrans, Google, etc) |
| `sanctum.php` | Configurasi Laravel Sanctum (API auth tokens) |
| `session.php` | Configurasi session |

**Contoh services.php:**
```php
'midtrans' => [
    'server_key' => env('MIDTRANS_SERVER_KEY'),
    'client_key' => env('MIDTRANS_CLIENT_KEY'),
],
'google' => [
    'maps_key' => env('GOOGLE_MAPS_KEY'),
],
```

---

### 5. **bootstrap/** - Bootstrap Files

| File | Fungsi |
|------|--------|
| `app.php` | Membuat instance Laravel application |
| `providers.php` | Load service providers |
| `cache/** | Cache files |

---

### 6. **storage/** - Runtime Storage

| Folder | Fungsi |
|--------|--------|
| `app/` | Menyimpan file uploads (images, certificates, dll) |
| `framework/` | Cache, sessions, views compiled |
| `logs/` | Application logs |

---

### 7. **tests/** - Test Files

| Folder | Fungsi |
|--------|--------|
| `Unit/` | Unit tests - test individual functions/methods |
| `Feature/` | Feature tests - test complete features/endpoints |
| `TestCase.php` | Base test class |

---

### 8. **vendor/** - Dependencies

Folder berisi semua package/library yang di-install via Composer.

---

### 9. **public/** - Public Assets

| File | Fungsi |
|------|--------|
| `index.php` | Entry point aplikasi |
| `storage/` | Symlink ke storage folder untuk serve uploaded files |
| `css/`, `js/` | Compiled CSS & JS |
| `robots.txt` | SEO configuration |
| `sw-admin.js` | Custom service worker script |

---

### 10. **Root Configuration Files**

| File | Fungsi |
|------|--------|
| `composer.json` | Dependency manager configuration (PHP packages) |
| `package.json` | Node dependencies (jika ada frontend build tools) |
| `phpunit.xml` | Konfigurasi testing framework |
| `.env` | Environment variables (database, API keys, dll) |
| `artisan` | CLI tool untuk menjalankan commands |
| `vite.config.js` | Configurasi build tool Vite |

---

## 🔄 Request Flow

```
HTTP Request
    ↓
Route (routes/api.php atau routes/web.php)
    ↓
Controller (app/Http/Controllers/)
    ↓
Model/Service (app/Models/ dan app/Services/)
    ↓
Database Query (via Eloquent ORM)
    ↓
Database (MySQL/PostgreSQL)
    ↓
Response → json/view
    ↓
HTTP Response
```

---

## 📊 Database Structure (Key Tables)

### Users
- id, email, password, name, phone, role (admin/customer)

### Customers
- id, user_id, address, latitude, longitude, preferences

### Menus
- id, name, description, price, image_url, category, availability

### Orders
- id, customer_id, total_price, payment_status, order_status, delivery_address, created_at

### OrderDetails
- id, order_id, menu_id, quantity, price

### Payments
- id, order_id, amount, payment_method, payment_status, transaction_id, created_at

### Notifications
- id, customer_id, type, title, message, read, created_at

### PushSubscriptions
- id, customer_id, endpoint, auth, p256dh (for Web Push)

---

## 🔐 Authentication Flow

1. Customer signup/login via `/api/auth/signup` atau `/api/auth/login`
2. Backend generate Sanctum API token
3. Frontend store token di localStorage
4. Setiap request ke protected endpoints include token di header
5. Middleware `auth:sanctum` verify token
6. If valid → process request, if invalid → return 401 unauthorized

---

## 🔔 Push Notification Flow

1. Frontend subscribe to push via `registerPushNotifications()`
2. Frontend send subscription details ke `/api/push-subscriptions`
3. Backend save subscription di database
4. Ketika ada event (order status update, menu change):
   - Service trigger `PushNotificationService`
   - Service send push ke semua subscribed clients
   - Frontend Service Worker handle notification

---

## 💳 Payment Integration (Midtrans)

1. Customer memilih menu, add to cart
2. Customer checkout & pilih payment method
3. Frontend call `/api/payments/create` dengan cart items
4. Backend (MidtransService) create transaction di Midtrans
5. Midtrans return payment token & URL
6. Frontend redirect to Midtrans payment page
7. After payment, Midtrans send webhook ke backend
8. Backend update payment status di database
9. If payment success → create Order, send notification

---

## 🛠 Tech Stack

- **Framework**: Laravel 11
- **Language**: PHP 8.2+
- **Database**: MySQL / PostgreSQL
- **API**: REST API with Laravel Sanctum
- **Authentication**: JWT tokens via Laravel Sanctum
- **Email**: Laravel Mailable
- **Queue**: Laravel Queue (Redis/Database)
- **Cache**: Redis / File Cache
- **File Storage**: Local / S3
- **Payment Gateway**: Midtrans
- **Admin Panel**: Filament (optional)
- **Real-time**: Websockets (optional)
- **Testing**: PHPUnit

---

## 📚 Common Artisan Commands

```bash
# Migrations
php artisan migrate              # Run migrations
php artisan migrate:rollback     # Rollback last migration
php artisan migrate:refresh      # Refresh database

# Seeding
php artisan db:seed              # Run all seeders
php artisan db:seed --class=MenuSeeder  # Run specific seeder

# Generate
php artisan make:model Menu      # Create model
php artisan make:migration create_menus_table  # Create migration
php artisan make:controller MenuController  # Create controller
php artisan make:request StoreMenuRequest  # Create form request
php artisan make:command MyCommand  # Create artisan command

# Testing
php artisan test                 # Run all tests
php artisan test --filter=TestName  # Run specific test

# Cache & Queue
php artisan cache:clear          # Clear all cache
php artisan queue:work           # Run queue worker
```

---

## 📝 Key Features

- **User Authentication**: Multi-role (admin, customer) authentication
- **Menu Management**: CRUD menu items dengan category, availability
- **Shopping Cart**: Add items, calculate totals
- **Order Management**: Create, track, cancel orders
- **Payment Processing**: Midtrans integration, multiple payment methods
- **Notifications**: Email & Web Push notifications
- **Recommendations**: Menu recommendations based on history
- **Admin Panel**: Filament admin interface untuk manage menus, orders, etc
- **API Security**: CORS, rate limiting, token validation
- **Logging**: Comprehensive logging untuk debugging

---
