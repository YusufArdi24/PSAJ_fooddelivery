import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ChefHat } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";

interface OrderItem {
  id: string;
  name: string;
  image: string;
  addOns: string[];
  price: number;
  quantity: number;
  date: string;
  status: "Done" | "Processing";
}

interface GroupedOrders {
  [year: string]: {
    [month: string]: OrderItem[];
  };
}

// Mock data untuk riwayat pesanan - akan diganti dengan data dari localStorage
const getMockOrders = (): OrderItem[] => {
  // Ambil order history dari localStorage
  const savedOrders = localStorage.getItem("orderHistory");
  if (savedOrders) {
    return JSON.parse(savedOrders);
  }
  
  // Return empty array jika belum ada pesanan
  return [];
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("All");
  const [activeNav, setActiveNav] = useState("orders");
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Untuk trigger refresh data
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    fullName: "",
    address: "",
  });

  // Load user data
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        setUserData({
          username: parsedUser.username || "",
          email: parsedUser.email || "",
          fullName: parsedUser.fullName || "",
          address: parsedUser.address || "",
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Refresh data ketika component mount atau ada perubahan
  useEffect(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isFirstLogin");
    localStorage.removeItem("hasSeenOnboarding");
    navigate("/signup");
  };

  // Fungsi untuk memformat harga sesuai dengan format aplikasi
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Fungsi untuk memformat tanggal
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
  };

  // Fungsi untuk mengelompokkan pesanan berdasarkan tahun dan bulan
  const groupOrdersByDate = (orders: OrderItem[]): GroupedOrders => {
    return orders.reduce((acc: GroupedOrders, order) => {
      const date = new Date(order.date);
      const year = date.getFullYear().toString();
      const month = date.toLocaleDateString('en-US', { month: 'long' });

      if (!acc[year]) {
        acc[year] = {};
      }
      if (!acc[year][month]) {
        acc[year][month] = [];
      }

      acc[year][month].push(order);
      return acc;
    }, {});
  };

  // Filter dan grup pesanan
  const filteredOrders = useMemo(() => {
    const mockOrders = getMockOrders(); // Ambil data dari localStorage
    let filtered = mockOrders;
    if (filterStatus !== "All") {
      filtered = mockOrders.filter(order => order.status === filterStatus);
    }
    
    // Urutkan dari terlama ke terbaru
    filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return groupOrdersByDate(filtered);
  }, [filterStatus, refreshTrigger]); // Tambahkan refreshTrigger sebagai dependency

  const handleBuyAgain = (order: OrderItem) => {
    // Untuk sekarang, redirect ke dashboard 
    // Di masa depan bisa ditambahkan logic untuk langsung add ke cart
    alert(`Menambahkan ${order.name} kembali ke keranjang`);
    navigate("/dashboard");
  };

  const handleLeaveReview = (order: OrderItem) => {
    // Implementasi untuk review system
    alert(`Fitur review untuk ${order.name} akan segera hadir!`);
  };

  const hasOrders = Object.keys(filteredOrders).length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar */}
      <MobileSidebar activeItem={activeNav} onItemClick={handleItemClick} />

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar activeItem={activeNav} onItemClick={handleItemClick} />
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          {/* Spacer for mobile header */}
          <div className="lg:hidden h-14" />

          {/* Header */}
          <Header 
            userData={userData}
            cartCount={0}
            onCartClick={() => {}}
            onLogout={handleLogout}
          />

          {/* Page Content */}
          <div className="p-4 lg:p-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-foreground">Riwayat Pesanan</h1>
            </div>
            {/* Filter Dropdown */}
            <div className="mb-6">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-20 h-8 text-sm border-border bg-card">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
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
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map(order => (
                          <Card key={order.id} className="border-border bg-card hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              {/* Order Header */}
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="text-lg font-semibold text-foreground mb-1">
                                    {order.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(order.date)}
                                  </p>
                                </div>
                              </div>

                              {/* Order Details */}
                              <div className="flex gap-4 mb-4">
                                {/* Image */}
                                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                                  <img
                                    src={order.image}
                                    alt={order.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='12' fill='%236b7280'%3EFood%3C/text%3E%3C/svg%3E";
                                    }}
                                  />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  {/* Add-ons */}
                                    {order.addOns.length > 0 && (
                                      <div className="mb-2">
                                        <p className="text-sm font-medium text-foreground mb-1">Add-ons:</p>
                                        <ul className="text-sm text-muted-foreground space-y-1">
                                          {order.addOns.map((addon, index) => (
                                            <li key={index}>• {addon}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    <div className="flex justify-between items-end">
                                      <div>
                                        <p className="text-2xl font-bold text-foreground">{formatPrice(order.price)}</p>
                                        <p className="text-sm text-muted-foreground">{order.quantity} Item</p>
                                      </div>
                                    </div>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="mb-4">
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  order.status === 'Done' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                  {order.status}
                                </span>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-3">
                                <Button
                                  onClick={() => handleBuyAgain(order)}
                                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                                >
                                  Buy again
                                </Button>
                                <Button
                                  onClick={() => handleLeaveReview(order)}
                                  variant="outline"
                                  className="flex-1 border-border text-foreground hover:bg-muted"
                                >
                                  Leave a review
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
        </main>
      </div>
    </div>
  );
}
