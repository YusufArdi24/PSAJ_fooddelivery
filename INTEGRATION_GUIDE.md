# 🍴 Food Delivery PWA - Backend Integration

## 📋 Overview

Proyek ini terdiri dari:
- **Frontend**: React PWA dengan Vite (`/fe`)
- **Backend**: Laravel API dengan Sanctum Authentication (`/be`)

## 🚀 Setup Instructions

### 1. Backend Setup (Laravel)

```bash
# Masuk ke direktori backend
cd be

# Install dependencies
composer install

# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Setup database (sesuaikan dengan .env)
php artisan migrate:fresh --seed

# Start Laravel server
php artisan serve
# Backend akan berjalan di http://localhost:8000
```

### 2. Frontend Setup (React PWA)

```bash
# Masuk ke direktori frontend
cd fe

# Install dependencies (pastikan Node.js >= 20.19.0)
npm install

# Start development server
npm run dev
# Frontend akan berjalan di http://localhost:5173
```

## 🔧 Configuration

### Backend Configuration
- **Database**: Sesuaikan konfigurasi database di `.env` backend
- **CORS**: Sudah dikonfigurasi untuk local development
- **Sanctum**: Authentication menggunakan Laravel Sanctum

### Frontend Configuration  
- **Proxy**: Vite dikonfigurasi untuk proxy `/api` ke `http://localhost:8000`
- **API Base URL**: `/api/v1` (melalui proxy Vite)

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/v1/customers/register     # Register customer
POST /api/v1/customers/login        # Login customer
POST /api/v1/customer/logout        # Logout customer (authenticated)
GET  /api/v1/customer/profile       # Get profile (authenticated)
PUT  /api/v1/customer/profile       # Update profile (authenticated)
```

### Menu Endpoints  

```
GET /api/v1/menus                   # Get all menus
GET /api/v1/menus/{id}              # Get menu by ID
GET /api/v1/menus/category/{cat}    # Get menus by category
```

### Cart Endpoints (Authenticated)

```
GET    /api/v1/cart                 # Get cart items
POST   /api/v1/cart                 # Add to cart
PUT    /api/v1/cart/{id}            # Update cart item
DELETE /api/v1/cart/{id}            # Remove cart item
POST   /api/v1/cart/clear           # Clear cart
POST   /api/v1/cart/checkout        # Checkout cart
```

## 🔐 Authentication Flow

1. **Register/Login**: Menggunakan endpoint authentication
2. **Token Storage**: Token disimpan di localStorage dengan key `access_token`
3. **API Calls**: Setiap request ke protected endpoints menyertakan `Authorization: Bearer {token}`
4. **Auto-redirect**: Jika token expired (401), user otomatis redirect ke login

## 📁 File Structure

### Frontend Services
```
src/
├── services/
│   ├── authService.ts      # Authentication API calls
│   ├── menuService.ts      # Menu API calls
│   └── cartService.ts      # Cart API calls
├── contexts/
│   ├── AuthContext.tsx     # Authentication state management
│   └── MenuContext.tsx     # Menu state management
├── lib/
│   └── api.ts              # API configuration & utilities
```

### Key Features Integrated
- ✅ **Authentication**: Register, Login, Logout dengan Laravel Sanctum
- ✅ **Menu Management**: Dynamic menu loading dari database
- ✅ **State Management**: React Context untuk Auth & Menu
- ✅ **Error Handling**: Comprehensive error handling & user feedback  
- ✅ **Loading States**: Loading indicators untuk semua API calls
- ✅ **Categories**: Dynamic category filtering dari backend

## 🌐 Development URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000  
- **API Base**: http://localhost:8000/api/v1

## 🛠️ Troubleshooting

### Common Issues

1. **CORS Error**: Pastikan Laravel backend berjalan di port 8000
2. **Node Version**: Pastikan menggunakan Node.js >= 20.19.0 
3. **Database Connection**: Periksa konfigurasi database di `.env` backend
4. **Token Issues**: Clear localStorage jika ada masalah authentication

### Development Tips

- **Hot Reload**: Frontend otomatis reload saat ada perubahan
- **API Debugging**: Cek Network tab di browser DevTools
- **Database**: Gunakan `php artisan migrate:fresh --seed` untuk reset data

## 📝 Next Steps

### Backend Enhancements
- [ ] Implement Order API endpoints
- [ ] Add Payment processing
- [ ] File upload untuk menu images
- [ ] Admin panel integration

### Frontend Enhancements  
- [ ] Real-time cart with backend sync
- [ ] Order history dari API
- [ ] Payment integration
- [ ] Push notifications

## 🤝 Contributing

1. Pastikan backend Laravel berjalan
2. Pastikan frontend React berjalan  
3. Test authentication flow
4. Test menu loading
5. Submit changes dengan clear documentation