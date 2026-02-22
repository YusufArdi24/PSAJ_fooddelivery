import { getAccessToken, API_BASE_URL } from "../lib/api";

export interface OrderItem {
  menu_id: string;
  quantity: number;
  selected_variant?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  payment_method: string;
  notes?: string;
}

export interface OrderDetail {
  OrderDetailID: number;
  OrderID: number;
  MenuID: number;
  quantity: number;
  price: number;
  original_price?: number | null;
  discount_per_item?: number | null;
  selected_variant?: string | null;
  created_at: string;
  updated_at: string;
  menu: {
    MenuID: number;
    menu_name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    is_available: boolean;
  };
}

export interface Order {
  OrderID: number;
  CustomerID: number;
  order_date: string;
  total_price: number;
  discount_amount?: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_details: OrderDetail[];
  payment?: {
    PaymentID: number;
    OrderID: number;
    payment_method: string;
    payment_status: string;
    payment_details: any;
    amount: number;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: {
    current_page: number;
    data: Order[];
    total: number;
    per_page: number;
    last_page: number;
  };
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

/**
 * Create a new order
 */
export const createOrder = async (
  orderData: CreateOrderRequest
): Promise<CreateOrderResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to create order",
        data: data.data,
      };
    }

    return data;
  } catch (error: any) {
    console.error("Error creating order:", error);
    return {
      success: false,
      message: error.message || "An error occurred while creating order",
      data: {} as Order,
    };
  }
};

/**
 * Get customer orders with pagination
 */
export const getCustomerOrders = async (
  page: number = 1,
  perPage: number = 10
): Promise<OrdersResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const url = `${API_BASE_URL}/orders?page=${page}&per_page=${perPage}`;
    console.log('[orderService] Fetching orders from:', url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    console.log('[orderService] Response status:', response.status);
    
    const data = await response.json();
    console.log('[orderService] Response data:', data);

    if (!response.ok) {
      console.error('[orderService] API error:', data);
      throw new Error(data.message || "Failed to fetch orders");
    }

    return data;
  } catch (error: any) {
    console.error("[orderService] Error fetching orders:", error);
    throw error;
  }
};

/**
 * Get a specific order by ID
 */
export const getOrder = async (orderId: number): Promise<Order> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch order");
    }

    return data.data;
  } catch (error: any) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

/**
 * Cancel an order
 */
export const cancelOrder = async (
  orderId: number
): Promise<{ success: boolean; message: string }> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to cancel order",
      };
    }

    return data;
  } catch (error: any) {
    console.error("Error cancelling order:", error);
    return {
      success: false,
      message: error.message || "An error occurred while cancelling order",
    };
  }
};

/**
 * Map order status to display text
 */
export const getOrderStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: "Menunggu Konfirmasi",
    confirmed: "Dikonfirmasi",
    preparing: "Sedang Diproses",
    ready: "Siap Diantar",
    on_delivery: "Sedang Dikirim",
    delivered: "Selesai",
    cancelled: "Dibatalkan",
  };

  return statusMap[status] || status;
};

/**
 * Get order status color
 */
export const getOrderStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    preparing: "bg-purple-500",
    ready: "bg-green-500",
    on_delivery: "bg-indigo-500",
    delivered: "bg-gray-500",
    cancelled: "bg-red-500",
  };

  return colorMap[status] || "bg-gray-500";
};
