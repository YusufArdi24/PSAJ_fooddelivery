/**
 * Customer Profile API service functions
 */

import {
  API_BASE_URL,
  getDefaultHeaders,
  handleApiResponse,
  handleApiError,
  setUserData,
  getAccessToken,
} from '../lib/api';

// Types
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  address_label?: string;
  address_notes?: string;
}

export interface CustomerProfileResponse {
  success: boolean;
  message?: string;
  data?: {
    customer: {
      CustomerID: number;
      name: string;
      email: string;
      phone: string;
      address: string;
      address_label?: string;
      address_notes?: string;
      avatar?: string;
      latitude?: number;
      longitude?: number;
      is_verified: boolean;
    };
  };
}

export interface AvatarUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    avatar: string;
    avatar_url: string;
    customer: any;
  };
}

/**
 * Get customer profile
 */
export const getCustomerProfile = async (): Promise<CustomerProfileResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE_URL}/customers/profile`, {
      method: 'GET',
      headers: getDefaultHeaders(),
    });

    const result = await handleApiResponse(response);
    
    // Update local storage with latest data
    if (result.success && result.data?.customer) {
      setUserData(result.data.customer);
    }
    
    return result;
  } catch (error: any) {
    console.error('Get profile error:', error);
    console.error('Get profile error details:', JSON.stringify(error));
    return {
      success: false,
      message: error.message || 'Failed to get profile',
      data: undefined
    };
  }
};

/**
 * Update customer location
 */
export const updateCustomerLocation = async (data: LocationData): Promise<CustomerProfileResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE_URL}/customers/location`, {
      method: 'POST',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(response);
    
    // Update local storage with latest data
    if (result.success && result.data?.customer) {
      setUserData(result.data.customer);
    }
    
    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Upload customer avatar
 */
export const uploadCustomerAvatar = async (file: File): Promise<AvatarUploadResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    // Create headers without Content-Type (browser will set it with boundary)
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/customers/avatar`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    const result = await handleApiResponse(response);
    
    // Update local storage with latest data
    if (result.success && result.data?.customer) {
      setUserData(result.data.customer);
    }
    
    return result;
  } catch (error: any) {
    console.error('Avatar upload error:', error);
    console.error('Avatar upload error details:', JSON.stringify(error));
    return {
      success: false,
      message: error.message || 'Failed to upload avatar',
      data: undefined
    };
  }
};

/**
 * Update customer profile
 */
export const updateCustomerProfile = async (data: {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  password_confirmation?: string;
}): Promise<CustomerProfileResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_BASE_URL}/customers/profile`, {
      method: 'PUT',
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });

    const result = await handleApiResponse(response);
    
    // Update local storage with latest data
    if (result.success && result.data?.customer) {
      setUserData(result.data.customer);
    }
    
    return result;
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get avatar URL from storage path
 * Returns the avatar URL or undefined if no avatar
 */
export const getAvatarUrl = (avatarPath: string | null | undefined): string | undefined => {
  console.log('[getAvatarUrl] Input avatarPath:', avatarPath);
  
  if (!avatarPath) {
    console.log('[getAvatarUrl] No avatar path, returning undefined');
    return undefined;
  }
  
  // If it's already a full URL (from Google OAuth), return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    console.log('[getAvatarUrl] Already full URL:', avatarPath);
    return avatarPath;
  }
  
  // If it already starts with /storage/, return as-is (Vite proxy will handle it)
  if (avatarPath.startsWith('/storage/')) {
    console.log('[getAvatarUrl] Storage path (proxied):', avatarPath);
    return avatarPath;
  }
  
  // Construct storage path (e.g., "avatars/xxx.jpg" -> "/storage/avatars/xxx.jpg")
  const storagePath = `/storage/${avatarPath}`;
  console.log('[getAvatarUrl] Constructed storage path:', storagePath);
  return storagePath;
};
