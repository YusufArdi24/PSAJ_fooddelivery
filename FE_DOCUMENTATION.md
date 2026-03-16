# Dokumentasi Frontend (FE) - PSAJ Food Delivery

## 📁 Struktur Folder Frontend

Frontend dibangun menggunakan **React TypeScript** dengan Vite sebagai build tool dan Tailwind CSS untuk styling.

---

## 📂 Direktori Utama

### 1. **src/** - Source Code Utama
Folder ini berisi semua kode sumber aplikasi frontend.

#### **src/components/** - Komponen Reusable
Folder berisi komponen UI yang dapat digunakan kembali di berbagai halaman.

| File | Fungsi |
|------|--------|
| `AnimatedPage.tsx` | Wrapper halaman dengan animasi transisi saat berpindah halaman |
| `CartSidebar.tsx` | Sidebar untuk menampilkan dan mengelola keranjang belanja |
| `ConfirmDialog.tsx` | Modal dialog untuk konfirmasi tindakan (hapus, batal, dll) |
| `EmailVerificationModal.tsx` | Modal untuk verifikasi email pengguna |
| `FilterBar.tsx` | Bar untuk filter menu berdasarkan kategori atau pencarian |
| `FoodCard.tsx` | Kartu produk makanan dengan gambar, harga, dan tombol action |
| `GoogleMapsLocationPicker.tsx` | Komponen untuk memilih lokasi menggunakan Google Maps |
| `Header.tsx` | Header/toolbar utama aplikasi |
| `LeafletLocationPicker.tsx` | Komponen alternatif untuk memilih lokasi menggunakan Leaflet |
| `MobileSidebar.tsx` | Versi mobile dari sidebar navigation |
| `NavLink.tsx` | Komponen link navigasi |
| `NotificationDropdown.tsx` | Dropdown untuk menampilkan notifikasi |
| `OnboardingModal.tsx` | Modal untuk onboarding/tutorial pengguna baru |
| `PaymentMethodModal.tsx` | Modal untuk memilih metode pembayaran |
| `PaymentModal.tsx` | Modal untuk proses pembayaran |
| `ProfileDropdown.tsx` | Dropdown menu profile pengguna |
| `Sidebar.tsx` | Sidebar navigasi utama |
| `SplashScreen.tsx` | Layar splash/loading saat aplikasi dimuat |
| **ui/** | Sub-folder berisi komponen UI dasar (button, input, dialog, dll) dari shadcn/ui |

---

#### **src/contexts/** - React Context (State Management)
Folder berisi Context API untuk state management global.

| File | Fungsi |
|------|--------|
| `AuthContext.tsx` | Mengelola state autentikasi (login, logout, user info) |
| `MenuContext.tsx` | Mengelola state menu/produk (daftar menu, kategori, filter) |
| `NotificationContext.tsx` | Mengelola state notifikasi (realtime push, polling, marking as read) |
| `ThemeContext.tsx` | Mengelola state tema (light/dark mode) |

---

#### **src/services/** - API Service Layer
Folder berisi semua fungsi yang berinteraksi dengan backend API.

| File | Fungsi |
|------|--------|
| `authService.ts` | API calls untuk autentikasi (login, signup, verify email, reset password) |
| `cartService.ts` | API calls untuk keranjang belanja (add, remove, update, checkout) |
| `customerService.ts` | API calls untuk data customer (profile, address, preferences) |
| `menuNotificationService.ts` | API calls untuk notifikasi menu (subscribe, check new menus) |
| `menuService.ts` | API calls untuk data menu (get menus, categories, search, recommendations) |
| `notificationService.ts` | API calls untuk push notification (subscribe, get notifications, mark as read) |
| `orderService.ts` | API calls untuk order (get history, get details, cancel order) |
| `paymentService.ts` | API calls untuk pembayaran (create transaction, verify payment, get methods) |

---

#### **src/pages/** - Halaman/Routes
Folder berisi komponen halaman yang memetakan ke routes aplikasi.

| File | Fungsi |
|------|--------|
| `Dashboard.tsx` | Halaman utama/beranda - menampilkan daftar menu dan rekomendasi |
| `SignIn.tsx` | Halaman login |
| `SignUp.tsx` | Halaman registrasi |
| `VerifyEmail.tsx` | Halaman verifikasi email setelah signup |
| `ForgotPassword.tsx` | Halaman untuk request reset password |
| `ResetPassword.tsx` | Halaman untuk reset password dengan token |
| `CompleteProfile.tsx` | Halaman untuk melengkapi profil setelah signup |
| `LocationPage.tsx` | Halaman untuk memilih lokasi pengiriman |
| `LocationConfirmation.tsx` | Halaman konfirmasi lokasi |
| `ManualAddressForm.tsx` | Form manual untuk memasukkan alamat |
| `OrderHistory.tsx` | Halaman riwayat pesanan |
| `Settings.tsx` | Halaman pengaturan aplikasi |
| `PaymentFinish.tsx` | Halaman saat pembayaran berhasil |
| `PaymentPending.tsx` | Halaman saat pembayaran sedang diproses |
| `PaymentError.tsx` | Halaman saat pembayaran gagal |
| `NotFound.tsx` | Halaman 404 - tidak ditemukan |

---

#### **src/hooks/** - Custom React Hooks
Folder berisi custom hooks untuk logic reusable.

---

#### **src/lib/** - Utility Functions
Folder berisi fungsi utility dan helper.

---

#### **src/App.tsx** - Root Component
Main component yang merender seluruh aplikasi, setup routing, providers, dll.

---

#### **src/main.tsx** - Entry Point
File utama untuk rendering React app ke DOM.

---

#### **src/index.css** - Global Styles
Stylesheet global untuk seluruh aplikasi.

---

#### **src/App.css** - App Styles
Stylesheet khusus untuk App component.

---

#### **src/vite-env.d.ts** - Type Definitions
File type definitions untuk Vite environment.

---

### 2. **public/** - Static Assets
File statis yang disajikan langsung tanpa processing.

| File/Folder | Fungsi |
|-------------|--------|
| `sw.js` | Service Worker untuk offline functionality dan push notifications |
| `payment-methods/` | Folder gambar metode pembayaran |

---

### 3. **Root Configuration Files**

| File | Fungsi |
|------|--------|
| `package.json` | Dependencies dan scripts npm |
| `tsconfig.json` | Konfigurasi TypeScript |
| `tsconfig.node.json` | Konfigurasi TypeScript untuk Node (Vite) |
| `vite.config.ts` | Konfigurasi Vite build tool |
| `index.html` | HTML entry point |
| `tailwind.config.ts` | Konfigurasi Tailwind CSS |
| `postcss.config.js` | Konfigurasi PostCSS |
| `eslint.config.js` | Konfigurasi ESLint (linting) |
| `README.md` | Dokumentasi project |

---

## 🔄 Data Flow

```
User Interaction (Pages) 
    ↓
Services (API calls) 
    ↓
Backend API 
    ↓
Services (format response) 
    ↓
Context (global state) 
    ↓
Components (display data)
```

---

## 📊 Context Architecture

### AuthContext
- Menyimpan: user info, auth token, login status
- Digunakan oleh: Sidebar, Header, Protected routes
- Operasi: login, logout, signup, verifyEmail

### MenuContext
- Menyimpan: daftar menu, kategori, filter, search
- Digunakan oleh: Dashboard, FilterBar, FoodCard
- Operasi: fetch menus, apply filters, search

### NotificationContext
- Menyimpan: notifications list, unread count, polling status
- Digunakan oleh: NotificationDropdown, pages
- Operasi: fetch notifications, mark as read, delete, subscribe to push

### ThemeContext
- Menyimpan: current theme (light/dark)
- Digunakan oleh: App component, semua halaman
- Operasi: toggle theme

---

## 🔗 API Service Pattern

Setiap service file mengikuti pattern:
1. Import axios atau fetch
2. Define API endpoints
3. Create functions untuk setiap endpoint
4. Export functions
5. Handle errors dan response formatting

Contoh:
```typescript
export async function getMenus(page: number, limit: number) {
  try {
    const response = await api.get('/api/menus', {
      params: { page, limit }
    });
    return response.data;
  } catch (error) {
    // handle error
  }
}
```

---

## 🎯 Key Features

- **Authentication**: Login, signup, email verification, password reset
- **Menu Management**: Browse, search, filter, view recommendations
- **Shopping Cart**: Add, remove, update items, view cart
- **Ordering**: Place order, view history, track order status
- **Notifications**: Real-time push notifications, polling for updates
- **Payments**: Multiple payment methods via Midtrans integration
- **Location Services**: Google Maps & Leaflet integration for address selection
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **Offline Support**: Service Worker untuk offline capabilities

---

## 🛠 Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API
- **API Client**: Axios
- **Maps**: Google Maps API & Leaflet
- **Notifications**: Web Push API
- **Payment**: Midtrans Payment Gateway

---
