import { useState, useRef, useEffect } from "react";
import { Bell, Package, TrendingUp, Sparkles, X, Trash2, Loader2 } from "lucide-react";
import { useNotification } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

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

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAllNotifications } = useNotification();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === "order_status" && notification.orderId) {
      setIsOpen(false);
      navigate("/order-history");
    } else if (notification.type === "new_menu" || notification.type === "price_change") {
      setIsOpen(false);
      navigate("/dashboard");
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order_status":
        return <Package className="w-5 h-5 text-blue-500" />;
      case "price_change":
        return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case "new_menu":
        return <Sparkles className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - new Date(date).getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMinutes < 1) return "Baru saja";
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    if (diffInDays < 7) return `${diffInDays} hari lalu`;
    
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifikasi"
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="fixed right-2 top-[76px] w-[calc(100vw-1rem)] sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 max-w-sm bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Notifikasi</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {unreadCount} notifikasi belum dibaca
                  </p>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[60vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    Belum ada notifikasi
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer group relative ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.timestamp)}
                          </p>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                          aria-label="Hapus notifikasi"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — Hapus Semua */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border bg-muted/10">
                <button
                  disabled={isDeletingAll}
                  onClick={async () => {
                    setIsDeletingAll(true);
                    await clearAllNotifications();
                    setIsDeletingAll(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/10 disabled:opacity-50 disabled:pointer-events-none font-medium py-1.5 px-3 rounded-md transition-colors"
                >
                  {isDeletingAll ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  {isDeletingAll ? "Menghapus..." : "Hapus Semua Notifikasi"}
                </button>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
};

export default NotificationDropdown;
