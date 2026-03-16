import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";
import { 
  getNotifications, 
  getUnreadCount, 
  markAsRead as apiMarkAsRead, 
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification,
  deleteAllNotifications as apiDeleteAllNotifications,
  getVapidPublicKey,
  subscribeToPush,
  urlBase64ToUint8Array,
  BackendNotification 
} from "../services/notificationService";
import { useAuth } from "./AuthContext";
import { toast } from "../components/ui/use-toast";

export interface NotificationItem {
  id: string;
  type: "order_status" | "price_change" | "new_menu";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  orderId?: number;
  menuId?: number;
  icon?: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isPolling: boolean;
  isLoading: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  clearUnread: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Poll interval: faster when tab is visible, slower when hidden
const POLL_INTERVAL_ACTIVE = 10000;  // 10 s
const POLL_INTERVAL_HIDDEN = 30000;  // 30 s

// Register service worker and subscribe to Web Push
async function registerPushNotifications(): Promise<void> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.log("[Push] Not supported in this browser.");
    return;
  }
  try {
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("[Push] Notification permission denied.");
        return;
      }
      const vapidKey = await getVapidPublicKey();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
    }

    await subscribeToPush(subscription);
    console.log("[Push] Subscribed successfully.");
  } catch (err) {
    console.error("[Push] Registration failed:", err);
  }
}

// Convert backend notification to frontend format
const convertNotification = (backendNotif: BackendNotification): NotificationItem => ({
  id: backendNotif.id.toString(),
  type: backendNotif.type,
  title: backendNotif.title,
  message: backendNotif.message,
  timestamp: new Date(backendNotif.created_at),
  read: backendNotif.read,
  orderId: backendNotif.order_id || undefined,
  menuId: backendNotif.menu_id || undefined,
});

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousNotificationIds = useRef<Set<string>>(new Set());

  const refreshNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const [notificationsResponse, count] = await Promise.all([
        getNotifications(1, 50),
        getUnreadCount(),
      ]);

      if (notificationsResponse.success) {
        const converted = notificationsResponse.data.data.map(convertNotification);
        
        // Detect new notifications and show toast
        const newNotifications = converted.filter(
          notif => !previousNotificationIds.current.has(notif.id) && !notif.read
        );
        
        // Show toast for new notifications (only if we have previous data)
        if (previousNotificationIds.current.size > 0 && newNotifications.length > 0) {
          newNotifications.forEach(notif => {
            console.log('[NotificationContext] New notification:', notif);
            
            // Play notification sound (optional)
            try {
              const audio = new Audio("/notification.mp3");
              audio.volume = 0.3;
              audio.play().catch(() => {
                // Ignore if sound fails to play
              });
            } catch (error) {
              // Ignore sound errors
            }
            
            toast({
              title: notif.title,
              description: notif.message,
              duration: 5000,
            });
          });
        }
        
        // Update previous IDs
        previousNotificationIds.current = new Set(converted.map(n => n.id));
        
        setNotifications(converted);
        setUnreadCount(count);
      }
    } catch (error) {
      console.error("[NotificationContext] Error refreshing notifications:", error);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiMarkAsRead(parseInt(id));
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("[NotificationContext] Error marking as read:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("[NotificationContext] Error marking all as read:", error);
    }
  }, []);

  const clearNotification = useCallback(async (id: string) => {
    try {
      await apiDeleteNotification(parseInt(id));
      setNotifications(prev => {
        const notif = prev.find(n => n.id === id);
        if (notif && !notif.read) setUnreadCount(c => Math.max(0, c - 1));
        return prev.filter(n => n.id !== id);
      });
    } catch (error) {
      console.error("[NotificationContext] Error deleting notification:", error);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    try {
      await apiDeleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      previousNotificationIds.current = new Set();
    } catch (error) {
      console.error("[NotificationContext] Error deleting all notifications:", error);
    }
  }, []);

  const clearUnread = useCallback(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  const restartInterval = useCallback((delay: number) => {
    if (pollIntervalIdRef.current) clearInterval(pollIntervalIdRef.current);
    pollIntervalIdRef.current = setInterval(() => refreshNotifications(), delay);
  }, [refreshNotifications]);

  const startPolling = useCallback(() => {
    setIsPolling(true);
    refreshNotifications();
    const delay = document.visibilityState === "visible" ? POLL_INTERVAL_ACTIVE : POLL_INTERVAL_HIDDEN;
    restartInterval(delay);
  }, [refreshNotifications, restartInterval]);

  const stopPolling = useCallback(() => {
    if (pollIntervalIdRef.current) {
      clearInterval(pollIntervalIdRef.current);
      pollIntervalIdRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Auto start polling + register push when user logs in
  useEffect(() => {
    if (user) {
      startPolling();
      registerPushNotifications();
    } else {
      stopPolling();
      setNotifications([]);
      setUnreadCount(0);
      previousNotificationIds.current = new Set();
    }

    return () => {
      if (pollIntervalIdRef.current) clearInterval(pollIntervalIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Adjust polling speed based on tab visibility
  useEffect(() => {
    if (!isPolling) return;

    const handleVisibilityChange = () => {
      const delay = document.visibilityState === "visible"
        ? POLL_INTERVAL_ACTIVE
        : POLL_INTERVAL_HIDDEN;
      if (document.visibilityState === "visible") refreshNotifications();
      restartInterval(delay);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isPolling, refreshNotifications, restartInterval]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isPolling,
    isLoading: false,
    startPolling,
    stopPolling,
    clearUnread,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
