# Midtrans Snap.js Origin Mismatch - Fix Guide

## Problem
```
Failed to execute 'postMessage' on 'DOMWindow': The target origin 
provided ('https://app.midtrans.com') does not match the recipient 
window's origin ('https://warung-edin-sandy.vercel.app').
```

**Cause**: Midtrans dashboard tidak mengenali domain frontend sebagai origin yang diizinkan untuk komunikasi snap.js

## Solution

### 1. UPDATE MIDTRANS DASHBOARD SETTINGS ⚠️ REQUIRED

**Step 1: Login ke Midtrans Dashboard**
- Sandbox: https://dashboard.sandbox.midtrans.com
- Production: https://dashboard.midtrans.com

**Step 2: Go to Settings → Configuration**

**Step 3: Scroll to "Allowed Origins"**

**Step 4: Add your frontend URLs:**
```
https://warung-edin-sandy.vercel.app
http://localhost:5173          (untuk development)
http://localhost:3000          (jika pakai port 3000)
http://127.0.0.1:5173          (development lokal)
```

**Step 5: Save & Verify**
- Tunggu beberapa menit untuk update
- Test payment flow kembali

### 2. OPTIONAL: Improve Frontend Error Handling

Update `/fe/src/services/paymentService.ts` untuk lebih robust:

```typescript
// Add proper error handling untuk snap.js loading
export const initializeMidtransSnap = async (snapUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if snap already loaded
    if ((window as any).snap) {
      console.log("Snap already initialized");
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = snapUrl;
    script.async = true;
    script.type = "text/javascript";
    
    // Add more detailed error handling
    script.onload = () => {
      console.log("Snap.js loaded successfully");
      
      // Verify snap object is available
      if (!(window as any).snap) {
        reject(new Error("Snap object not found after loading script"));
        return;
      }
      
      // Configure snap if production
      if ((window as any).snap.setClientKey) {
        // Some versions support this
      }
      
      resolve();
    };
    
    script.onerror = () => {
      console.error("Failed to load Snap.js from:", snapUrl);
      reject(new Error(`Failed to load Snap.js from ${snapUrl}`));
    };

    // Handle timeout
    const timeout = setTimeout(() => {
      console.error("Snap.js loading timeout");
      reject(new Error("Snap.js loading timeout"));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      console.log("Snap.js loaded successfully");
      if (!(window as any).snap) {
        reject(new Error("Snap object not found"));
        return;
      }
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timeout);
      console.error("Failed to load Snap.js");
      reject(new Error("Failed to load Snap.js"));
    };

    document.head.appendChild(script);
  });
};
```

## Test Checklist

- [ ] Domain added ke Midtrans dashboard allowed origins
- [ ] 5-10 menit sudah terlewat untuk propagasi
- [ ] Refresh browser (Ctrl+Shift+R untuk clear cache)
- [ ] Console tidak menunjukkan postMessage error
- [ ] Midtrans payment modal muncul dengan payment methods
- [ ] Bisa memilih payment method (GoPay, DANA, etc)
- [ ] Payment flow complete tanpa error

## Troubleshooting

### Masih Error?
1. Clear browser cache: Ctrl+Shift+R
2. Tunggu 5-10 menit lagi untuk dashboard sync
3. Cek di DevTools → Network, apakah snap.js berhasil load (200 OK)
4. Cek Origins setting di dashboard, pastikan sudah tersimpan

### Verify di Midtrans Dashboard:
1. Go to Settings → Configuration
2. Scroll to Allowed Origins
3. Confirm domain tercantum
4. Klik test/reload jika ada opsi

### Check Logs:
- Browser Console (F12): Cek untuk error messages
- Midtrans Dashboard → Transactions: Lihat transaction history
- Check bila ada "origin" related error

## Environment Variable Check

Ensure backend `.env` sudah tepat:

```bash
# For production
MIDTRANS_IS_PRODUCTION=true
MIDTRANS_CLIENT_KEY=Mid-client-PRODUCTION-KEY

# For sandbox (testing)
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_CLIENT_KEY=Mid-client-SANDBOX-KEY
```

## Additional Notes

- **Midtrans snap.js loads from CDN** - tidak bisa self-hosted (security reason)
- **Origin check adalah security feature** - melindungi dari unauthorized usage
- **Propagation delay** - perubahan di dashboard butuh waktu 5-10 menit
- **Multiple origins supported** - boleh add localhost + production sekaligus
