# Admin Notification System - Documentation

## 📋 Overview

Sistem notifikasi admin yang terintegrasi dengan Filament panel untuk memberikan notifikasi real-time kepada admin ketika ada pesanan baru dari customer.

### ✨ Fitur

1. **Web Push Notifications** - Notifikasi push yang muncul di device admin bahkan ketika panel admin tidak dibuka
2. **In-App Notifications** - Icon notifikasi di navbar dengan dropdown list notifikasi
3. **Auto-Update** - Polling otomatis setiap 10 detik tanpa perlu refresh
4. **Notification Badge** - Badge merah menampilkan jumlah notifikasi yang belum dibaca
5. **Click to Action** - Klik notifikasi pesanan baru langsung redirect ke halaman edit order

---

## 🏗️ Arsitektur Sistem

### 1. Database Tables

#### `admin_notifications`
```sql
- id (bigint, primary key)
- AdminID (bigint, nullable) - null = broadcast ke semua admin
- type (string) - 'new_order', 'order_status_change', dll
- title (string) - Judul notifikasi
- body (text) - Isi notifikasi
- data (json) - Data tambahan (OrderID, dll)
- read_at (timestamp, nullable)
- created_at, updated_at
```

#### `admin_push_subscriptions`
```sql
- id (bigint, primary key)
- AdminID (bigint)
- endpoint (string)
- public_key (text)
- auth_token (text)
- created_at, updated_at
```

### 2. Backend Components

#### Models
- **AdminNotification** (`app/Models/AdminNotification.php`)
  - Manages in-app notifications
  - Scopes: `unread()`, `read()`, `forAdmin($adminId)`
  - Methods: `markAsRead()`, `isUnread()`

- **AdminPushSubscription** (`app/Models/AdminPushSubscription.php`)
  - Manages web push subscriptions

#### Services
- **WebPushService** (`app/Services/WebPushService.php`)
  - `notifyAdmins(array $data, ?int $adminId = null)` - Send notification to specific/all admins
  - `notifyNewOrder($order)` - Send new order notification

#### Observers
- **OrderObserver** (`app/Observers/OrderObserver.php`)
  - `created()` - Triggers admin notification when new order is placed
  - `updated()` - Triggers customer notification when order status changes

#### Controllers
- **AdminNotificationController** (`app/Http/Controllers/AdminNotificationController.php`)
  - `GET /admin-notifications` - Get recent unread notifications
  - `GET /admin-notifications/all` - Get all notifications (paginated)
  - `POST /admin-notifications/{id}/read` - Mark notification as read
  - `POST /admin-notifications/read-all` - Mark all as read
  - `DELETE /admin-notifications/{id}` - Delete notification

- **AdminPushSubscriptionController** (`app/Http/Controllers/AdminPushSubscriptionController.php`)
  - `POST /admin-push/subscribe` - Subscribe to push notifications
  - `POST /admin-push/unsubscribe` - Unsubscribe

### 3. Frontend Components

#### Livewire Component
- **NotificationBell** (`app/Livewire/Admin/NotificationBell.php`)
  - Real-time notification bell with dropdown
  - Wire polling: updates every 10 seconds
  - Methods: `loadNotifications()`, `toggleDropdown()`, `markAsRead()`, `markAllAsRead()`

#### Views
- `resources/views/livewire/admin/notification-bell.blade.php` - Notification bell UI
- `resources/views/livewire/admin/notification-bell-wrapper.blade.php` - Wrapper for render hook

#### Service Worker
- `public/sw-admin.js` - Handles web push notifications
  - Listens for push events
  - Shows notification with custom data
  - Handles notification click (opens/focuses admin panel)

---

## 🚀 Setup Instructions

### 1. Pastikan VAPID Keys sudah ada di `.env`

```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@warungedin.com
```

Jika belum ada, generate dengan:
```bash
php artisan webpush:vapid
```

### 2. Jalankan Migrasi

```bash
cd be
php artisan migrate
```

Ini akan membuat tabel `admin_notifications`.

### 3. Clear Cache

```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### 4. Restart Server

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

### 5. Test di Browser

1. Buka admin panel: `http://127.0.0.1:8000/admin`
2. Login sebagai admin
3. Browser akan meminta permission untuk notifications → Klik "Allow"
4. Lihat icon bell (🔔) di navbar sebelah kiri user menu
5. Buat order baru dari aplikasi frontend customer
6. Admin harus menerima:
   - Web push notification (muncul di device)
   - Badge merah di icon bell dengan angka notifikasi
   - Dropdown notification ketika bell diklik

---

## 🎯 Cara Kerja

### Flow Notifikasi Pesanan Baru

```
1. Customer membuat order baru
   ↓
2. OrderObserver::created() dipanggil
   ↓
3. WebPushService::notifyNewOrder($order)
   ↓
4. A. Simpan ke database → admin_notifications table
   B. Kirim web push → semua AdminPushSubscription
   ↓
5. A. Service Worker menerima push → tampilkan notification
   B. Livewire polling setiap 10 detik → update badge & dropdown
   ↓
6. Admin klik notification → redirect ke /admin/orders/{id}/edit
```

### Auto-Update Mechanism

- **Wire Polling**: Livewire component melakukan `wire:poll.10s="loadNotifications"`
- Setiap 10 detik, method `loadNotifications()` dipanggil
- Mengambil data terbaru dari database
- Update badge count dan list notifikasi
- **Tidak perlu refresh manual**

### Web Push Flow

```
1. Admin login → Service worker registered
   ↓
2. Request notification permission
   ↓
3. Subscribe to push manager dengan VAPID key
   ↓
4. Send subscription to backend → POST /admin-push/subscribe
   ↓
5. Subscription disimpan di admin_push_subscriptions table
   ↓
6. Ketika ada notifikasi baru:
   - Backend kirim push via Web Push Protocol
   - Service worker receive push event
   - Show notification
```

---

## 📱 Notification Icon & UI

### Notification Bell Features

1. **Badge Counter**
   - Merah dengan angka unread notifications
   - Display "9+" jika lebih dari 9

2. **Dropdown Panel**
   - Width: 320px (80 Tailwind units)
   - Max height: 384px (96 units) dengan scroll
   - Recent 5 unread notifications

3. **Notification Item**
   - Icon badge berdasarkan type (amber untuk order, blue untuk general)
   - Title, body, dan timestamp
   - Hover effect
   - Click to mark as read & redirect

4. **Empty State**
   - Icon bell dengan pesan "Tidak ada notifikasi"

5. **Actions**
   - "Tandai semua dibaca" button
   - "Lihat Semua Pesanan" link

---

## 🔧 Customization

### Mengubah Interval Polling

Edit `resources/views/livewire/admin/notification-bell.blade.php`:

```blade
<!-- Ganti 10s menjadi interval yang diinginkan (5s, 15s, 30s, dll) -->
<div wire:poll.10s="loadNotifications">
```

### Menambah Tipe Notifikasi Baru

1. **Buat data notifikasi**

```php
use App\Services\WebPushService;

app(WebPushService::class)->notifyAdmins([
    'title' => 'Judul Notifikasi',
    'body' => 'Isi pesan notifikasi',
    'type' => 'custom_type', // new_order, order_cancelled, dll
    'data' => [
        'custom_data' => 'nilai',
    ],
], $adminId); // null untuk broadcast ke semua admin
```

2. **Tambah icon di dropdown** (opsional)

Edit `resources/views/livewire/admin/notification-bell.blade.php`:

```blade
@if($notification['type'] === 'custom_type')
    <div class="...">
        <!-- Custom icon SVG -->
    </div>
@endif
```

### Mengubah Jumlah Notifikasi di Dropdown

Edit `app/Livewire/Admin/NotificationBell.php`:

```php
public function loadNotifications()
{
    // Ganti limit dari 5 ke angka yang diinginkan
    $this->notifications = AdminNotification::forAdmin($admin->AdminID)
        ->unread()
        ->orderBy('created_at', 'desc')
        ->limit(5) // <-- Ubah ini
        ->get()
        // ...
}
```

---

## 🧪 Testing

### Manual Testing

1. **Test Web Push**
   ```
   - Login ke admin panel
   - Check console untuk "[AdminPush] subscribed"
   - Buat order baru dari customer app
   - Harus muncul push notification
   ```

2. **Test In-App Notification**
   ```
   - Refresh admin panel
   - Badge di bell icon harus update
   - Klik bell → dropdown show notifications
   - Klik notification → redirect ke order page
   ```

3. **Test Polling**
   ```
   - Buka admin panel
   - Biarkan terbuka tanpa interaksi
   - Buat order baru dari device lain
   - Dalam 10 detik, badge harus update otomatis
   ```

### Database Testing

```sql
-- Check notifications
SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 10;

-- Check push subscriptions
SELECT AdminID, endpoint FROM admin_push_subscriptions;

-- Count unread notifications per admin
SELECT AdminID, COUNT(*) as unread 
FROM admin_notifications 
WHERE read_at IS NULL 
GROUP BY AdminID;
```

### API Testing

```bash
# Get notifications (requires authenticated admin session)
curl -X GET http://127.0.0.1:8000/admin-notifications \
  -H "Cookie: your_session_cookie" \
  -H "Accept: application/json"

# Mark as read
curl -X POST http://127.0.0.1:8000/admin-notifications/1/read \
  -H "Cookie: your_session_cookie" \
  -H "X-CSRF-TOKEN: your_csrf_token"

# Mark all as read
curl -X POST http://127.0.0.1:8000/admin-notifications/read-all \
  -H "Cookie: your_session_cookie" \
  -H "X-CSRF-TOKEN: your_csrf_token"
```

---

## 🐛 Troubleshooting

### Notifikasi tidak muncul

1. **Check VAPID keys**
   ```bash
   php artisan tinker
   >>> config('app.vapid_public_key')
   >>> config('app.vapid_private_key')
   ```
   Harus ada nilai, bukan empty string.

2. **Check service worker registration**
   - Buka DevTools → Application → Service Workers
   - Harus ada `sw-admin.js` dengan status "activated"

3. **Check browser permission**
   - Buka Site Settings di browser
   - Pastikan Notifications = "Allow"

4. **Check console errors**
   - Buka DevTools → Console
   - Cari error "[AdminPush]" atau service worker errors

### Badge tidak update

1. **Check Livewire polling**
   - Buka DevTools → Network tab
   - Filter: XHR/Fetch
   - Harus ada request setiap 10 detik ke Livewire endpoint

2. **Check database**
   ```sql
   SELECT * FROM admin_notifications WHERE read_at IS NULL;
   ```
   Harus ada data unread notifications.

3. **Clear cache**
   ```bash
   php artisan view:clear
   php artisan cache:clear
   ```

### Push subscription failed

1. **Check HTTPS**
   - Web Push hanya bekerja di HTTPS atau localhost
   - Pastikan menggunakan `127.0.0.1` atau HTTPS

2. **Check composer package**
   ```bash
   composer show | grep web-push
   ```
   Harus ada `minishlink/web-push`.

3. **Check logs**
   ```bash
   tail -f storage/logs/laravel.log | grep WebPush
   ```

---

## 📝 Notes

### Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari 16+ (macOS Ventura+)
- ❌ Safari iOS (tidak support web push saat ini)

### Performance

- Polling interval: 10 detik (configurable)
- Notification limit per fetch: 5 unread
- Database index pada `(AdminID, read_at, created_at)` untuk query cepat

### Security

- Web push menggunakan VAPID authentication
- All endpoints protected dengan `auth:admin` middleware
- CSRF token required untuk POST/DELETE requests
- Push subscriptions scoped per AdminID

### Future Improvements

- [ ] Real-time updates dengan Laravel Echo (WebSocket)
- [ ] Notification sound option
- [ ] Filter notifications by type
- [ ] Notification preferences per admin
- [ ] Notification history page
- [ ] Mark as unread feature
- [ ] Notification templates

---

## 📚 References

- [Filament v3 Documentation](https://filamentphp.com/docs/3.x)
- [Livewire Documentation](https://livewire.laravel.com/docs)
- [Web Push Protocol](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [minishlink/web-push](https://github.com/web-push-libs/web-push-php)

---

## 👨‍💻 Development Info

**Created**: 2026-03-06  
**Laravel Version**: 11.x  
**Filament Version**: 3.x  
**Livewire Version**: 3.x

---

Sistem notifikasi admin sudah siap digunakan! 🎉
