import { getAccessToken, API_BASE_URL } from "../lib/api";

export interface BackendNotification {
  id: number;
  CustomerID: number;
  type: "order_status" | "price_change" | "new_menu";
  title: string;
  message: string;
  order_id: number | null;
  menu_id: number | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  order?: any;
  menu?: any;
}

export interface NotificationsResponse {
  success: boolean;
  data: {
    current_page: number;
    data: BackendNotification[];
    total: number;
    per_page: number;
    last_page: number;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

/**
 * Get customer notifications
 */
export const getNotifications = async (
  page: number = 1,
  perPage: number = 20,
  unreadOnly: boolean = false
): Promise<NotificationsResponse> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    let url = `${API_BASE_URL}/notifications?page=${page}&per_page=${perPage}`;
    if (unreadOnly) {
      url += '&unread_only=1';
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch notifications");
    }

    return data;
  } catch (error: any) {
    console.error("[notificationService] Error fetching notifications:", error);
    throw error;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data: UnreadCountResponse = await response.json();

    if (!response.ok) {
      throw new Error("Failed to fetch unread count");
    }

    return data.count;
  } catch (error: any) {
    console.error("[notificationService] Error fetching unread count:", error);
    return 0;
  }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (id: number): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to mark as read");
    }
  } catch (error: any) {
    console.error("[notificationService] Error marking as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to mark all as read");
    }
  } catch (error: any) {
    console.error("[notificationService] Error marking all as read:", error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (id: number): Promise<void> => {
  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error("No access token found");
    }

    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete notification");
    }
  } catch (error: any) {
    console.error("[notificationService] Error deleting notification:", error);
    throw error;
  }
};

/**
 * Delete ALL notifications (read and unread)
 */
export const deleteAllNotifications = async (): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error("No access token found");

  const response = await fetch(`${API_BASE_URL}/notifications/delete-all`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to delete all notifications");
  }
};

// ─── Web Push Subscription ────────────────────────────────────────────────────

/**
 * Fetch the VAPID public key from the backend
 */
export const getVapidPublicKey = async (): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/push-vapid-key`, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Failed to get VAPID key");
  return data.public_key as string;
};

/**
 * Send a push subscription to the backend
 */
export const subscribeToPush = async (subscription: PushSubscription): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  const json = subscription.toJSON();

  const response = await fetch(`${API_BASE_URL}/push-subscribe`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      public_key: json.keys?.p256dh ?? "",
      auth_token: json.keys?.auth ?? "",
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to save push subscription");
  }
};

/**
 * Remove push subscription from the backend
 */
export const unsubscribeFromPush = async (endpoint: string): Promise<void> => {
  const token = getAccessToken();
  if (!token) throw new Error("No access token");

  await fetch(`${API_BASE_URL}/push-unsubscribe`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ endpoint }),
  });
};

/**
 * Convert a VAPID base64url public key to a Uint8Array for pushManager.subscribe()
 */
export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};
