/**
 * API Configuration and base utilities for connecting to Laravel backend
 */

// Base API URL - use proxy in development, direct URL in production
// Check for environment variable first (Vercel), or use proxy
const isDevelopment = import.meta.env.MODE === 'development';
const envApiUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = isDevelopment 
  ? '/api/v1'  // Use Vite proxy in development
  : (envApiUrl || '/api/v1');  // Use VITE_API_BASE_URL in production, fallback to proxy

// API endpoints configuration
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    CUSTOMER_REGISTER: '/customers/register',
    CUSTOMER_LOGIN: '/customers/login',
    CUSTOMER_GOOGLE_LOGIN: '/customers/google-login',
    CUSTOMER_LOGOUT: '/customer/logout',
    CUSTOMER_PROFILE: '/customer/profile',
    CUSTOMER_FORGOT_PASSWORD: '/customers/forgot-password',
    CUSTOMER_RESET_PASSWORD: '/customers/reset-password',
    CUSTOMER_CHANGE_PASSWORD: '/customer/change-password',
    CUSTOMER_EMAIL_RESEND: '/customers/email/resend',
    CUSTOMER_VERIFY_TOKEN: '/customers/email/verify-token',
    // Pending-registration flow
    CUSTOMER_PRE_REGISTER: '/customers/pre-register',
    CUSTOMER_GOOGLE_AUTH: '/customers/google-auth',
    CUSTOMER_VERIFY_OTP: '/customers/verify-otp',
    CUSTOMER_RESEND_OTP: '/customers/resend-otp',
    CUSTOMER_COMPLETE_REGISTRATION: '/customers/complete-registration',
  },
  
  // Menu endpoints
  MENU: {
    LIST: '/menus',
    DETAIL: (id: string) => `/menus/${id}`,
    BY_CATEGORY: (category: string) => `/menus/category/${category}`,
  },
  
  // Cart endpoints
  CART: {
    LIST: '/cart',
    ADD: '/cart',
    UPDATE: (id: string) => `/cart/${id}`,
    DELETE: (id: string) => `/cart/${id}`,
    CLEAR: '/cart/clear',
    CHECKOUT: '/cart/checkout',
  },
  
  // Order endpoints
  ORDER: {
    LIST: '/orders',
    CREATE: '/orders',
    DETAIL: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },
  
  // Payment endpoints
  PAYMENT: {
    METHODS: '/payment-methods',
  },
} as const;

// HTTP methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

// Storage keys for localStorage
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  USER_DATA: 'user_data',
  CART_DATA: 'cart_data',
} as const;

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Set access token in localStorage
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
};

/**
 * Remove access token from localStorage
 */
export const removeAccessToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return getAccessToken() !== null;
};

/**
 * Get stored user data
 */
export const getUserData = () => {
  const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
  return userData ? JSON.parse(userData) : null;
};

/**
 * Set user data in localStorage
 */
export const setUserData = (userData: any): void => {
  localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
};

/**
 * Remove user data from localStorage
 */
export const removeUserData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.USER_DATA);
};

/**
 * Default fetch headers
 */
export const getDefaultHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  const token = getAccessToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Dispatch a global event when the server returns 401 Unauthorized.
 * AuthContext listens for this to automatically clear the session.
 */
export const dispatchSessionExpired = (): void => {
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
};

/**
 * Handle API response
 */
export const handleApiResponse = async (response: Response) => {
  // Log response for debugging
  console.log('API Response Status:', response.status);
  console.log('API Response URL:', response.url);

  if (!response.ok) {
    // 401 means the token was revoked (e.g. user signed in from another device).
    // Only dispatch the event when there IS a stored token (i.e. the user was
    // authenticated) to avoid firing it on plain failed login attempts.
    if (response.status === 401 && getAccessToken()) {
      dispatchSessionExpired();
    }

    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorDetails = null;
    
    try {
      const errorData = await response.json();
      console.log('Error Response:', errorData);
      errorMessage = errorData.message || errorData.error || errorMessage;
      
      // Include validation errors if available
      if (errorData.errors) {
        errorDetails = errorData.errors;
      }
    } catch (parseError) {
      console.log('Failed to parse error response:', parseError);
    }
    
    const error: any = new Error(errorMessage);
    error.status = response.status;
    error.validationErrors = errorDetails;
    throw error;
  }
  
  const result = await response.json();
  console.log('Success Response:', result);
  return result;
};

/**
 * Handle API errors
 * NOTE: Does NOT clear tokens — token management is the caller's responsibility.
 */
export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw error;
};