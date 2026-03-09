import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ChefHat, Trash2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";
import { useAuth } from "../contexts/AuthContext";
import { useNotification } from "../contexts/NotificationContext";
import { toast } from "../components/ui/use-toast";
import { getCustomerOrders, getOrderStatusText, getOrderStatusColor, hideOrder, reorder } from "../services/orderService";
import { getAvatarUrl } from "../services/customerService";

interface OrderItem {
  OrderID: number;
  order_date: string;
  total_price: number | string;
  discount_amount?: number | string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_details: {
    OrderDetailID: number;
    MenuID: number;
    quantity: number;
    price: number | string;
    original_price?: number | string | null;
    discount_per_item?: number | string | null;
    selected_variant?: string | null;
    menu?: {
      MenuID: number;
      menu_name: string;
      description: string;
      price: number | string;
      category: string;
      image: string | null;
      is_available: boolean;
    } | null;
  }[];
  payment?: {
    PaymentID: number;
    payment_method: string;
    payment_status: string;
    amount: number | string;
  } | null;
}

interface GroupedOrders {
  [year: string]: {
    [month: string]: OrderItem[];
  };
}

export default function OrderHistory() {
  const navigate = useNavigate();
  const { user, logout, isLoading } = useAuth();
  const { clearUnread } = useNotification();
  const [filterStatus, setFilterStatus] = useState("All");
  const [activeNav, setActiveNav] = useState("orders");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [deletingOrderId, setDeletingOrderId] = useState<number | null>(null);
  const [reorderingOrderId, setReorderingOrderId] = useState<number | null>(null);

  // Authentication check
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate("/signin");
      return;
    }
  }, [user, isLoading, navigate]);

  // Refresh data ketika component mount atau ada perubahan
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      // Clear notification badge when viewing order history
      clearUnread();
      
      setIsLoadingOrders(true);
      try {
        console.log('[OrderHistory] Fetching orders...');
        const response = await getCustomerOrders(1, 100);
        console.log('[OrderHistory] Response:', response);
        
        if (response.success) {
          console.log('[OrderHistory] Orders data:', response.data);
          console.log('[OrderHistory] Orders array:', response.data.data);
          
          // Ensure we have valid data
          if (response.data && Array.isArray(response.data.data)) {
            setOrders(response.data.data);
          } else {
            console.error('[OrderHistory] Invalid data structure:', response.data);
            setOrders([]);
          }
        } else {
          console.error('[OrderHistory] Response not successful');
          setOrders([]);
        }
      } catch (error) {
        console.error("[OrderHistory] Error fetching orders:", error);
        setOrders([]);
        toast({
          title: "Gagal memuat pesanan",
          description: "Terjadi kesalahan saat memuat riwayat pesanan.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user]);

  const handleItemClick = (item: string) => {
    if (item === "logout") {
      handleLogout();
    } else if (item === "settings") {
      navigate("/settings");
    } else if (item === "dashboard") {
      navigate("/dashboard");
    } else {
      setActiveNav(item);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout berhasil",
        description: "Anda telah berhasil keluar dari akun.",
      });
      navigate("/signin");
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway
      navigate("/signin");
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm("Yakin ingin menghapus pesanan ini dari riwayat Anda?")) {
      return;
    }

    setDeletingOrderId(orderId);
    try {
      const result = await hideOrder(orderId);
      if (result.success) {
        // Remove order from local state
        setOrders(prevOrders => prevOrders.filter(order => order.OrderID !== orderId));
        toast({
          title: "Pesanan dihapus",
          description: "Pesanan berhasil dihapus dari riwayat Anda.",
        });
      } else {
        toast({
          title: "Gagal menghapus",
          description: result.message || "Terjadi kesalahan saat menghapus pesanan.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Gagal menghapus",
        description: "Terjadi kesalahan saat menghapus pesanan.",
        variant: "destructive",
      });
    } finally {
      setDeletingOrderId(null);
    }
  };

  const handleReorder = async (orderId: number) => {
    setReorderingOrderId(orderId);
    try {
      const result = await reorder(orderId);
      if (result.success && result.data?.items) {
        // Navigate to dashboard with cart items
        navigate("/dashboard", { state: { reorderItems: result.data.items, openCart: true } });
        toast({
          title: "Pesanan ditambahkan!",
          description: "Item pesanan telah ditambahkan ke keranjang.",
        });
      } else {
        toast({
          title: "Gagal memesan lagi",
          description: result.message || "Beberapa menu mungkin sudah tidak tersedia.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error reordering:", error);
      toast({
        title: "Gagal memesan lagi",
        description: "Terjadi kesalahan saat memesan lagi.",
        variant: "destructive",
      });
    } finally {
      setReorderingOrderId(null);
    }
  };

  // Fungsi untuk memformat harga sesuai dengan format aplikasi
  const formatPrice = (price: number | string | undefined | null) => {
    if (price === undefined || price === null) return 'Rp 0';
    const num = Number(price);
    if (isNaN(num)) return 'Rp 0';
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Fungsi untuk memformat tanggal
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      };
      const formattedDate = date.toLocaleDateString('en-US', options);
      const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return `${formattedDate} | ${time}`;
    } catch (error) {
      console.error('[OrderHistory] Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Fungsi untuk mengelompokkan pesanan berdasarkan tahun dan bulan
  const groupOrdersByDate = (orders: OrderItem[]): GroupedOrders => {
    if (!Array.isArray(orders)) {
      console.error('[OrderHistory] groupOrdersByDate: orders is not an array', orders);
      return {};
    }
    
    return orders.reduce((acc: GroupedOrders, order) => {
      try {
        if (!order?.order_date) {
          console.warn('[OrderHistory] Order missing order_date:', order);
          return acc;
        }
        
        const date = new Date(order.order_date);
        if (isNaN(date.getTime())) {
          console.warn('[OrderHistory] Invalid date for order:', order);
          return acc;
        }
        
        const year = date.getFullYear().toString();
        const month = date.toLocaleDateString('en-US', { month: 'long' });

        if (!acc[year]) {
          acc[year] = {};
        }
        if (!acc[year][month]) {
          acc[year][month] = [];
        }

        acc[year][month].push(order);
      } catch (error) {
        console.error('[OrderHistory] Error grouping order:', error, order);
      }
      return acc;
    }, {});
  };

  // Filter dan grup pesanan
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    if (filterStatus !== "All") {
      filtered = orders.filter(order => order.status === filterStatus);
    }
    
    // Urutkan dari terbaru ke terlama
    filtered.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
    
    return groupOrdersByDate(filtered);
  }, [filterStatus, orders]);

  const hasOrders = Object.keys(filteredOrders).length > 0;

  // Show loading state
  if (isLoading || isLoadingOrders) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated (handled in useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <MobileSidebar activeItem={activeNav} onItemClick={handleItemClick} isOpen={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar activeItem={activeNav} onItemClick={handleItemClick} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Spacer for mobile header */}
          {/* Header */}
          <Header 
            userData={{
              username: user.name || "Guest",
              email: user.email || "guest@example.com",
              id: user.CustomerID?.toString() || "",
              avatar: user.avatar ? getAvatarUrl(user.avatar) : undefined
            }}
            cartCount={0}
            onCartClick={() => {}}
            onLogout={handleLogout}
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
          />

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
            {/* Page Content */}
            <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Riwayat Pesanan</h1>
            </div>
            {/* Filter Dropdown */}
            <div className="mb-6">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48 h-8 text-sm border-border bg-card">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Semua Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="on_delivery">Diantar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Empty State */}
            {!hasOrders ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <ChefHat className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Belum Ada Riwayat Pesanan
                </h3>
                <p className="text-muted-foreground max-w-md">
                  Riwayat pesanan akan muncul setelah Anda melakukan pemesanan dan pembayaran berhasil.
                </p>
              </div>
          ) : (
            /* Orders List */
            <div className="space-y-8">
              {Object.keys(filteredOrders)
                .sort((a, b) => parseInt(b) - parseInt(a))
                .map(year => (
                <div key={year} className="space-y-6">
                  {/* Year Header */}
                  <h2 className="text-2xl font-bold text-foreground">{year}</h2>
                  
                  {Object.keys(filteredOrders[year])
                    .sort((a, b) => {
                      const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                                        'July', 'August', 'September', 'October', 'November', 'December'];
                      return monthOrder.indexOf(b) - monthOrder.indexOf(a);
                    })
                    .map(month => (
                    <div key={month} className="space-y-4">
                      {/* Month Header */}
                      <h3 className="text-xl font-semibold text-foreground mt-8 first:mt-0">
                        {month}
                      </h3>
                      
                      {/* Orders for this month */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {filteredOrders[year][month]
                          .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
                          .map(order => (
                          <Card key={order.OrderID} className="border-border bg-card hover:shadow-md transition-shadow h-full flex flex-col">
                            <CardContent className="p-4 flex flex-col flex-1">
                              {/* Order Header */}
                              <div className="flex justify-between items-start mb-3 gap-2">
                                <div className="min-w-0 flex-1">
                                  <h4 className="text-base font-semibold text-foreground mb-1 truncate">
                                    Pesanan #{order.OrderID}
                                  </h4>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(order.order_date)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`px-2 py-1 rounded-full text-xs font-semibold text-white flex-shrink-0 ${getOrderStatusColor(order.status)}`}>
                                    {getOrderStatusText(order.status)}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteOrder(order.OrderID)}
                                    disabled={deletingOrderId === order.OrderID}
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  >
                                    {deletingOrderId === order.OrderID ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Order Details */}
                              <div className="space-y-3 mb-4">
                                {order.order_details && Array.isArray(order.order_details) && order.order_details.map((detail) => {
                                  const menuName = detail?.menu?.menu_name || 'Menu tidak tersedia';
                                  const menuImage = detail?.menu?.image || null;
                                  const placeholderImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='12' fill='%236b7280'%3EFood%3C/text%3E%3C/svg%3E";
                                  const origPrice = Number(detail.original_price);
                                  const discPerItem = Number(detail.discount_per_item);
                                  const unitPrice = Number(detail.price);
                                  const qty = Number(detail.quantity);
                                  const hasItemDiscount = origPrice > 0 && discPerItem > 0;
                                  return (
                                  <div key={detail.OrderDetailID} className="flex gap-3">
                                    {/* Image */}
                                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                      <img
                                        src={menuImage || placeholderImg}
                                        alt={menuName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = placeholderImg;
                                        }}
                                      />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground">{menuName}</p>
                                      {detail.selected_variant && (
                                        <span className="inline-block text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium mb-1">
                                          {detail.selected_variant}
                                        </span>
                                      )}
                                      {hasItemDiscount ? (
                                        <>
                                          <p className="text-xs text-muted-foreground line-through">
                                            {qty}x @ {formatPrice(origPrice)}
                                          </p>
                                          <p className="text-xs text-orange-500 mb-1 break-words">
                                            Diskon {formatPrice(discPerItem)}/item &rarr; {qty}x @ {formatPrice(unitPrice)}
                                          </p>
                                          <p className="text-sm font-semibold text-primary">{formatPrice(unitPrice * qty)}</p>
                                        </>
                                      ) : (
                                        <>
                                          <p className="text-xs text-muted-foreground mb-1">{qty}x @ {formatPrice(unitPrice)}</p>
                                          <p className="text-sm font-semibold text-primary">{formatPrice(unitPrice * qty)}</p>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>

                              {/* Notes */}
                              {order.notes && (
                                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                                  <p className="text-xs font-semibold text-foreground mb-1">Catatan:</p>
                                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                                </div>
                              )}

                              {/* Total Price */}
                              <div className="mb-4 p-3 bg-primary/5 rounded-lg space-y-1">
                                {(() => {
                                  // Compute from item-level data (API already returns discounted price per item)
                                  const finalTotal = order.order_details?.reduce(
                                    (sum, d) => sum + Number(d.price) * Number(d.quantity), 0
                                  ) ?? Number(order.total_price);
                                  const originalTotal = order.order_details?.reduce(
                                    (sum, d) => sum + Number(d.original_price) * Number(d.quantity), 0
                                  ) ?? 0;
                                  const discountAmt = Number(order.discount_amount ?? 0);
                                  // Has discount if any item has original_price > price
                                  const hasDiscount = discountAmt > 0 || originalTotal > finalTotal;
                                  const displayOriginal = originalTotal > 0 ? originalTotal : (finalTotal + discountAmt);
                                  const displayDiscount = originalTotal > 0 ? (originalTotal - finalTotal) : discountAmt;
                                  return (
                                    <>
                                      {hasDiscount && (
                                        <div className="flex justify-between items-center">
                                          <p className="text-xs text-muted-foreground">Subtotal</p>
                                          <p className="text-xs text-muted-foreground line-through">{formatPrice(displayOriginal)}</p>
                                        </div>
                                      )}
                                      {hasDiscount && (
                                        <div className="flex justify-between items-center">
                                          <p className="text-xs text-orange-500 font-medium">Diskon</p>
                                          <p className="text-xs text-orange-500 font-medium">- {formatPrice(displayDiscount)}</p>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center pt-1 border-t border-primary/10">
                                        <p className="text-sm font-semibold text-foreground">Total Pembayaran</p>
                                        <p className="text-lg font-bold text-primary">{formatPrice(finalTotal)}</p>
                                      </div>
                                      {order.payment && (
                                        <p className="text-xs text-muted-foreground">via {order.payment.payment_method}</p>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3 mt-auto pt-0">
                                <Button
                                  onClick={() => handleReorder(order.OrderID)}
                                  disabled={reorderingOrderId === order.OrderID}
                                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
                                >
                                  {reorderingOrderId === order.OrderID ? (
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  ) : null}
                                  Pesan Lagi
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
