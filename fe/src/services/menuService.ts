/**
 * Menu API service functions
 */

import {
  API_BASE_URL,
  API_ENDPOINTS,
  HTTP_METHODS,
  getDefaultHeaders,
  handleApiResponse,
  handleApiError,
} from '../lib/api';

// Types
export interface MenuItem {
  MenuID: number;
  name: string;
  description: string;
  price: string | number; // API returns string, but we can handle both
  category: string;
  image: string;
  image_url?: string; // Full URL for image from backend
  image_type: string;
  is_available: boolean;
  formatted_price?: string;
  created_at: string;
  updated_at: string;
  // Promo fields
  has_promo?: boolean;
  promo?: {
    PromoID: number;
    title: string;
    promo_type: 'percentage' | 'fixed';
    discount_value: number;
    formatted_discount: string;
    start_date: string;
    end_date: string;
  };
  original_price?: number;
  discounted_price?: number;
  formatted_original_price?: string;
  formatted_discounted_price?: string;
  display_price?: number;
  // Variant options set by admin
  variants?: string[];
}

export interface MenuListResponse {
  success: boolean;
  data: {
    current_page: number;
    data: MenuItem[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  message?: string;
}

export interface MenuDetailResponse {
  success: boolean;
  data: MenuItem;
  message?: string;
}

/**
 * Get all menus
 */
export const getMenus = async (): Promise<MenuListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MENU.LIST}?per_page=200`, {
      method: HTTP_METHODS.GET,
      headers: getDefaultHeaders(),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get menu by ID
 */
export const getMenuById = async (id: string): Promise<MenuDetailResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MENU.DETAIL(id)}`, {
      method: HTTP_METHODS.GET,
      headers: getDefaultHeaders(),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get menus by category
 */
export const getMenusByCategory = async (category: string): Promise<MenuListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MENU.BY_CATEGORY(category)}`, {
      method: HTTP_METHODS.GET,
      headers: getDefaultHeaders(),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Filter menus by availability
 */
export const getAvailableMenus = async (): Promise<MenuItem[]> => {
  try {
    const result = await getMenus();
    if (result.success && result.data && result.data.data) {
      return result.data.data.filter(menu => menu.is_available);
    }
    return [];
  } catch (error) {
    console.error('Error getting available menus:', error);
    return [];
  }
};

/**
 * Search menus by name
 */
export const searchMenus = async (query: string): Promise<MenuItem[]> => {
  try {
    const result = await getMenus();
    if (result.success && result.data && result.data.data) {
      return result.data.data.filter(menu => 
        menu.name.toLowerCase().includes(query.toLowerCase()) ||
        menu.description.toLowerCase().includes(query.toLowerCase())
      );
    }
    return [];
  } catch (error) {
    console.error('Error searching menus:', error);
    return [];
  }
};

/**
 * Get menu categories
 */
export const getMenuCategories = async (): Promise<string[]> => {
  // Return all predefined categories regardless of whether menus exist
  return ['makanan', 'minuman', 'lainnya'];
};

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return `Rp ${price.toLocaleString('id-ID')}`;
};

/**
 * Convert backend menu data to frontend format for compatibility
 */
export const convertMenuToFrontendFormat = (menu: MenuItem) => {
  // Convert price from string to number if needed
  const price = typeof menu.price === 'string' ? parseFloat(menu.price) : menu.price;
  const displayPrice = menu.display_price 
    ? (typeof menu.display_price === 'string' ? parseFloat(menu.display_price) : menu.display_price)
    : price;
  
  return {
    id: menu.MenuID.toString(),
    name: menu.name,
    price: displayPrice, // Use display_price (with discount if applicable)
    image: menu.image_url || menu.image || '', // Use image_url from backend, fallback to image
    available: menu.is_available,
    category: menu.category,
    description: menu.description,
    // Promo fields
    hasPromo: menu.has_promo || false,
    originalPrice: menu.original_price,
    discountedPrice: menu.discounted_price,
    formattedDiscount: menu.promo?.formatted_discount,
    promoTitle: menu.promo?.title,
    // Variant options
    variants: menu.variants || [],
  };
};