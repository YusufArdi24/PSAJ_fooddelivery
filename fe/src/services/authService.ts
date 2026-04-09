/**
 * Authentication API service functions
 */

import {
  API_BASE_URL,
  API_ENDPOINTS,
  HTTP_METHODS,
  getDefaultHeaders,
  handleApiResponse,
  handleApiError,
  setAccessToken,
  setUserData,
  removeAccessToken,
  removeUserData,
} from '../lib/api';

// Types
export interface CustomerRegisterData {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  password_confirmation: string;
}

export interface CustomerLoginData {
  email: string;
  password: string;
}

export interface CustomerProfileUpdate {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface ChangePasswordData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    customer: {
      CustomerID: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      is_verified: boolean;
    };
  };
}

/**
 * Login customer via Google OAuth credential (ID token)
 */
export const googleLoginCustomer = async (credential: string): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_GOOGLE_LOGIN}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify({ credential }),
    });

    const result = await handleApiResponse(response);

    if (result.success && result.data) {
      if (result.data.token) {
        setAccessToken(result.data.token);
      }
      if (result.data.customer) {
        setUserData(result.data.customer);
      }
    }

    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Register new customer
 */
export const registerCustomer = async (data: CustomerRegisterData): Promise<AuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_REGISTER}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(response);
    
    // Store token and user data from response.data
    if (result.success && result.data) {
      if (result.data.token) {
        setAccessToken(result.data.token);
      }
      if (result.data.customer) {
        setUserData(result.data.customer);
      }
    }
    
    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Login customer
 */
export const loginCustomer = async (data: CustomerLoginData): Promise<AuthResponse> => {
  try {
    const url = `${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_LOGIN}`;
    const headers = getDefaultHeaders();
    
    console.log('Login Request URL:', url);
    console.log('Login Request Headers:', headers);
    console.log('Login Request Data:', data);
    
    const response = await fetch(url, {
      method: HTTP_METHODS.POST,
      headers: headers,
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(response);
    
    console.log('Login API Response:', result);
    
    // Store token and user data from response.data
    if (result.success && result.data) {
      if (result.data.token) {
        setAccessToken(result.data.token);
      }
      if (result.data.customer) {
        setUserData(result.data.customer);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Login API Error:', error);
    return handleApiError(error);
  }
};

/**
 * Logout customer
 */
export const logoutCustomer = async (): Promise<void> => {
  try {
    await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_LOGOUT}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
    });
    
    // Always clear local storage regardless of API response
    removeAccessToken();
    removeUserData();
  } catch (error) {
    // Even if API fails, clear local storage
    removeAccessToken();
    removeUserData();
    console.error('Logout error:', error);
  }
};

/**
 * Get customer profile
 */
export const getCustomerProfile = async () => {
  try {
    console.log('Fetching customer profile...');
    
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_PROFILE}`, {
      method: HTTP_METHODS.GET,
      headers: getDefaultHeaders(),
    });

    console.log('Profile API response status:', response.status);
    
    const result = await handleApiResponse(response);
    
    console.log('Profile API result:', result);
    
    // Laravel API returns: { success: true, data: { customer: {...} } }
    // Update stored user data if successful
    if (result.success && result.data && result.data.customer) {
      setUserData(result.data.customer);
    }
    
    return result;
  } catch (error) {
    // Just rethrow — do NOT call handleApiError which used to wipe the token
    console.error('Get customer profile error:', error);
    throw error;
  }
};

/**
 * Update customer profile
 */
export const updateCustomerProfile = async (data: CustomerProfileUpdate) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_PROFILE}`, {
      method: HTTP_METHODS.PUT,
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(response);
    
    // Update stored user data (backend returns data as direct customer object)
    if (result.success && result.data) {
      setUserData(result.data);
    }
    
    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Change customer password
 */
export const changeCustomerPassword = async (data: ChangePasswordData) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_CHANGE_PASSWORD}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Forgot password
 */
export const forgotPassword = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_FORGOT_PASSWORD}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify({ email }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Verify email via token (called when user clicks link in Gmail)
 */
export const verifyEmailToken = async (id: string, hash: string, email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_VERIFY_TOKEN}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify({ id, hash, email }),
    });

    const result = await handleApiResponse(response);

    // Backend returns a fresh token so all subsequent calls are authenticated,
    // even if the old token was wiped (e.g. stale token, different browser tab).
    if (result.success && result.data) {
      if (result.data.token)    setAccessToken(result.data.token);
      if (result.data.customer) setUserData(result.data.customer);
    }

    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Resend email verification
 */
export const resendVerificationEmail = async (email: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_EMAIL_RESEND}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify({ email }),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Reset password
 */
export const resetPassword = async (data: {
  email: string;
  token: string;
  password: string;
  password_confirmation: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_RESET_PASSWORD}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Pending-registration flow (account only created after all steps done)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * STEP 1 (email): Store pending registration data and send OTP email.
 * Returns { success, pending_token, message }
 */
export const preRegisterCustomer = async (data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_PRE_REGISTER}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });
    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * STEP 1 (Google): Verify Google access token.
 * If existing verified account → returns { success, is_login: true, data: { customer, token } }
 * If new/unverified      → returns { success, is_login: false, needs_otp, pending_token, email }
 */
export const googleAuthCustomer = async (accessToken: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_GOOGLE_AUTH}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify({ access_token: accessToken }),
    });
    const result = await handleApiResponse(response);
    // If it's an actual login (existing verified account), persist credentials now
    if (result.success && result.is_login && result.data) {
      if (result.data.token)    setAccessToken(result.data.token);
      if (result.data.customer) setUserData(result.data.customer);
    }
    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * STEP 2: Submit OTP code.
 * Returns { success, message }
 */
export const verifyOtp = async (pendingToken: string, otp: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_VERIFY_OTP}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify({ pending_token: pendingToken, otp }),
    });
    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * STEP 2b: Resend OTP.
 * Returns { success, message }
 */
export const resendOtpCode = async (pendingToken: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_RESEND_OTP}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify({ pending_token: pendingToken }),
    });
    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * STEP 3: Complete registration – creates the Customer account and issues a token.
 * Returns { success, data: { customer, token } }
 */
export const completeRegistration = async (data: {
  pending_token: string;
  phone: string;
  address: string;
  address_label?: string;
  address_notes?: string;
  latitude: number;
  longitude: number;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.AUTH.CUSTOMER_COMPLETE_REGISTRATION}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleApiResponse(response);
    if (result.success && result.data) {
      if (result.data.token)    setAccessToken(result.data.token);
      if (result.data.customer) setUserData(result.data.customer);
    }
    return result;
  } catch (error) {
    return handleApiError(error);
  }
};