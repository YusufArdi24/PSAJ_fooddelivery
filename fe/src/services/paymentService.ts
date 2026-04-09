import { getAccessToken, API_BASE_URL } from "../lib/api";

export interface PaymentMethod {
  key: string;
  name: string;
  description: string;
  type: 'offline' | 'ewallet' | 'qr_code' | 'bank_transfer';
  use_midtrans: boolean;
  icon: string;
}

export interface PaymentMethodsResponse {
  success: boolean;
  data: PaymentMethod[];
  midtrans: {
    client_key: string;
    snap_url: string;
  };
}

export interface SnapTransactionResponse {
  success: boolean;
  message: string;
  data: {
    snap_token: string;
    redirect_url: string;
    midtrans_order_id: string;
    client_key: string;
    snap_js_url: string;
    payment_id: number;
  };
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    PaymentID: number;
    OrderID: number;
    payment_method: string;
    payment_status: string;
    payment_reference: string | null;
    amount: number;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
  };
}

/**
 * Get all available payment methods
 */
export const getPaymentMethods = async (): Promise<PaymentMethodsResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/payment-methods`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch payment methods");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }
};

/**
 * Create a Snap transaction for payment
 * This endpoint requires authentication
 * @param orderId - The order ID to create payment for
 * @param paymentMethod - Optional. The payment method selected (e.g., 'dana', 'gopay', etc.)
 *                        If not provided, Midtrans Snap will show all available payment methods
 */
export const createSnapTransaction = async (
  orderId: number,
  paymentMethod?: string
): Promise<SnapTransactionResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const body: Record<string, any> = { 
      order_id: orderId,
    };
    
    // Only include payment_method if provided
    if (paymentMethod) {
      body.payment_method = paymentMethod;
    }

    const response = await fetch(`${API_BASE_URL}/payment/snap/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Failed to create payment transaction"
      );
    }

    return data;
  } catch (error) {
    console.error("Error creating snap transaction:", error);
    throw error;
  }
};

/**
 * Initialize Midtrans Snap.js payment gateway
 * This function loads the Snap.js script if not already loaded
 * Handles origin mismatches and loading errors gracefully
 */
export const initializeMidtransSnap = async (
  snapUrl: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if Snap.js already loaded
    if ((window as any).snap) {
      console.log("✓ Snap.js already initialized");
      resolve();
      return;
    }

    console.log("Loading Snap.js from:", snapUrl);

    // Create script element
    const script = document.createElement("script");
    script.src = snapUrl;
    script.async = true;
    script.type = "text/javascript";

    // Timeout handler (10 seconds)
    const timeout = setTimeout(() => {
      console.error("❌ Snap.js loading timeout");
      document.head.removeChild(script);
      reject(new Error("Midtrans Snap.js loading timeout - please check your internet connection"));
    }, 10000);

    script.onload = () => {
      clearTimeout(timeout);
      
      // Verify snap object is available
      if (!((window as any).snap)) {
        console.error("❌ Snap.js loaded but snap object not found");
        reject(new Error("Midtrans Snap.js loaded but snap object is undefined. This usually means: 1) Domain not whitelisted in Midtrans dashboard, or 2) snap.js version mismatch"));
        return;
      }

      console.log("✓ Snap.js loaded and initialized successfully");
      resolve();
    };

    script.onerror = (event) => {
      clearTimeout(timeout);
      console.error("❌ Failed to load Snap.js:", event);
      reject(new Error(`Failed to load Midtrans Snap.js. Please check: 1) Internet connection, 2) Snap URL is correct, 3) Browser console for CORS errors`));
    };

    // Handle script loading errors
    script.onabort = () => {
      clearTimeout(timeout);
      console.error("❌ Snap.js loading aborted");
      reject(new Error("Snap.js loading was aborted"));
    };

    document.head.appendChild(script);
  });
};

/**
 * Open Midtrans payment modal/redirect
 * Handles payment flow with detailed error reporting
 */
export const openMidtransPayment = async (snapToken: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!(window as any).snap) {
      console.error("❌ Snap object not initialized");
      reject(new Error("Midtrans Snap not initialized. This usually means: 1) snap.js failed to load, 2) Domain not whitelisted in Midtrans dashboard"));
      return;
    }

    console.log("Opening Midtrans payment modal...");

    try {
      (window as any).snap.pay(snapToken, {
        onSuccess: (result: any) => {
          console.log("✓ Payment success:", result);
          resolve();
        },
        onPending: (result: any) => {
          console.log("⏳ Payment pending:", result);
          resolve();
        },
        onError: (result: any) => {
          console.error("❌ Payment error:", result);
          reject(new Error(`Payment error: ${result?.error_msg || JSON.stringify(result)}`));
        },
        onClose: () => {
          console.log("Payment modal closed by user");
          resolve();
        },
      });
    } catch (error: any) {
      console.error("❌ Error calling snap.pay():", error);
      reject(new Error(`Failed to open payment modal: ${error?.message || String(error)}`));
    }
  });
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (
  paymentId: number
): Promise<PaymentStatusResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/admin/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to check payment status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
};
