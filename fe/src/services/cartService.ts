/**
 * Cart API service functions
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
export interface CartItem {
  CartID: number;
  CustomerID: number;
  MenuID: number;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
  menu?: {
    MenuID: number;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    is_available: boolean;
  };
}

export interface CartListResponse {
  data: CartItem[];
  total_amount: number;
  total_items: number;
  message: string;
}

export interface CartActionResponse {
  data: CartItem;
  message: string;
}

export interface AddToCartData {
  menu_id: number;
  quantity: number;
}

export interface UpdateCartData {
  quantity: number;
}

/**
 * Get cart items
 */
export const getCart = async (): Promise<CartListResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.LIST}`, {
      method: HTTP_METHODS.GET,
      headers: getDefaultHeaders(),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Add item to cart
 */
export const addToCart = async (data: AddToCartData): Promise<CartActionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.ADD}`, {
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
 * Update cart item
 */
export const updateCartItem = async (id: string, data: UpdateCartData): Promise<CartActionResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.UPDATE(id)}`, {
      method: HTTP_METHODS.PUT,
      headers: getDefaultHeaders(),
      body: JSON.stringify(data),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Remove item from cart
 */
export const removeFromCart = async (id: string): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.DELETE(id)}`, {
      method: HTTP_METHODS.DELETE,
      headers: getDefaultHeaders(),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Clear entire cart
 */
export const clearCart = async (): Promise<{ message: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.CLEAR}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Checkout cart (convert cart to order)
 */
export const checkoutCart = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.CART.CHECKOUT}`, {
      method: HTTP_METHODS.POST,
      headers: getDefaultHeaders(),
    });

    return await handleApiResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};

/**
 * Get cart total items count
 */
export const getCartCount = async (): Promise<number> => {
  try {
    const result = await getCart();
    return result.total_items || 0;
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0;
  }
};

/**
 * Get cart total amount
 */
export const getCartTotal = async (): Promise<number> => {
  try {
    const result = await getCart();
    return result.total_amount || 0;
  } catch (error) {
    console.error('Error getting cart total:', error);
    return 0;
  }
};

/**
 * Convert backend cart item to frontend format
 */
export const convertCartItemToFrontendFormat = (item: CartItem) => {
  return {
    id: item.CartID.toString(),
    name: item.menu?.name || 'Unknown Item',
    price: item.price,
    image: item.menu?.image || '',
    quantity: item.quantity,
    menuId: item.MenuID,
  };
};