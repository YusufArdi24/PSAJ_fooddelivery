import { API_BASE_URL } from "../lib/api";

export interface MenuNotification {
  MenuID: number;
  menu_name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecentMenusResponse {
  success: boolean;
  data: MenuNotification[];
  count: number;
}

export interface MenuUpdatesResponse {
  success: boolean;
  data: MenuNotification[];
  count: number;
}

/**
 * Get recently added menus (last N days)
 */
export const getRecentMenus = async (days: number = 7): Promise<RecentMenusResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/menus-recent?days=${days}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch recent menus");
    }

    return data;
  } catch (error: any) {
    console.error("[menuNotificationService] Error fetching recent menus:", error);
    throw error;
  }
};

/**
 * Get menu updates (price changes, etc) since a given timestamp
 */
export const getMenuUpdates = async (since: string): Promise<MenuUpdatesResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/menus-updates?since=${encodeURIComponent(since)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch menu updates");
    }

    return data;
  } catch (error: any) {
    console.error("[menuNotificationService] Error fetching menu updates:", error);
    throw error;
  }
};

/**
 * Track menu prices for change detection
 */
export class MenuPriceTracker {
  private static STORAGE_KEY = "menu_price_tracker";

  static getPrices(): Map<number, number> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return new Map(Object.entries(parsed).map(([k, v]) => [parseInt(k), v as number]));
      }
    } catch (error) {
      console.error("Error loading menu prices:", error);
    }
    return new Map();
  }

  static savePrices(prices: Map<number, number>): void {
    try {
      const obj = Object.fromEntries(prices);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error("Error saving menu prices:", error);
    }
  }

  static updatePrice(menuId: number, price: number): void {
    const prices = this.getPrices();
    prices.set(menuId, price);
    this.savePrices(prices);
  }

  static checkPriceChange(menuId: number, newPrice: number): { changed: boolean; oldPrice?: number } {
    const prices = this.getPrices();
    const oldPrice = prices.get(menuId);
    
    if (oldPrice === undefined) {
      // First time seeing this menu
      this.updatePrice(menuId, newPrice);
      return { changed: false };
    }
    
    if (oldPrice !== newPrice) {
      this.updatePrice(menuId, newPrice);
      return { changed: true, oldPrice };
    }
    
    return { changed: false };
  }
}
