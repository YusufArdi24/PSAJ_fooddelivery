import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FilterBar from "../components/FilterBar";
import FoodCard from "../components/FoodCard";
import MobileSidebar from "../components/MobileSidebar";
import OnboardingModal from "../components/OnboardingModal";
import CartSidebar from "../components/CartSidebar";

// Import food images
import nasiGoreng from "../assets/food-nasi-goreng.jpg";
import ayamBakar from "../assets/food-ayam-bakar.jpg";
import mieGoreng from "../assets/food-mie-goreng.jpg";
import leleGoreng from "../assets/food-lele-goreng.jpg";
import bihunGoreng from "../assets/food-bihun-goreng.jpg";
import lemonTea from "../assets/drink-lemon-tea.jpg";
import esTeh from "../assets/drink-es-teh.jpg";
import capcay from "../assets/food-capcay.jpg";

// Import kebutuhan rumah tangga images
import gasElpiji from "../assets/GasElpiji_3kg.jpg";
import galonLeMinerale from "../assets/Galon_Leminerale.jpg";
import galonAqua from "../assets/Galon_Aqua.jpg";

// Interfaces
interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

// Menu data
const menuItems = [
  {
    id: "1",
    name: "Paket Ayam Goreng",
    price: 12000,
    image: nasiGoreng,
    available: true,
    category: "makanan",
  },
  {
    id: "2",
    name: "Paket Patin Goreng",
    price: 12000,
    image: ayamBakar,
    available: true,
    category: "makanan",
  },
  {
    id: "3",
    name: "Paket Lele",
    price: 12000,
    image: leleGoreng,
    available: true,
    category: "makanan",
  },
  {
    id: "4",
    name: "Bihun Goreng",
    price: 12000,
    image: bihunGoreng,
    available: true,
    category: "makanan",
  },
  {
    id: "5",
    name: "Paket Ayam Bakar",
    price: 12000,
    image: ayamBakar,
    available: true,
    category: "makanan",
  },
  {
    id: "6",
    name: "Nasi Goreng Biasa",
    price: 12000,
    image: nasiGoreng,
    available: true,
    category: "makanan",
  },
  {
    id: "7",
    name: "Mie Goreng",
    price: 12000,
    image: mieGoreng,
    available: false,
    category: "makanan",
  },
  {
    id: "8",
    name: "Capcay Goreng",
    price: 12000,
    image: capcay,
    available: false,
    category: "makanan",
  },
  {
    id: "9",
    name: "Lemon Tea",
    price: 4000,
    image: lemonTea,
    available: true,
    category: "minuman",
  },
  {
    id: "10",
    name: "Es Teh",
    price: 2500,
    image: esTeh,
    available: true,
    category: "minuman",
  },
  {
    id: "11",
    name: "Gas Elpiji 3kg",
    price: 18000,
    image: gasElpiji,
    available: true,
    category: "kebutuhan-rumah-tangga",
  },
  {
    id: "12",
    name: "Galon Le Minerale",
    price: 22000,
    image: galonLeMinerale,
    available: true,
    category: "kebutuhan-rumah-tangga",
  },
  {
    id: "13",
    name: "Galon Aqua",
    price: 24000,
    image: galonAqua,
    available: true,
    category: "kebutuhan-rumah-tangga",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // User data state
  const [userData, setUserData] = useState({
    username: "Guest",
    email: "guest@example.com",
    id: ""
  });
  
  // Cart states
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliverAddress, setDeliverAddress] = useState("Sumampir jatisari, Jl Aquamarine blok H no 4");
  const [note, setNote] = useState("");
  
  // Computed cart count
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleItemClick = (item: string) => {
    if (item === "logout") {
      handleLogout();
    } else if (item === "settings") {
      navigate("/settings");
    } else if (item === "orders") {
      navigate("/order-history");
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

  useEffect(() => {
    // Load user data from localStorage
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      navigate("/signup");
      return;
    }

    try {
      const parsedUser = JSON.parse(currentUser);
      
      // Check if user has address, if not redirect to location page
      if (!parsedUser.hasAddress && !parsedUser.address) {
        localStorage.setItem("isFirstLogin", "true");
        navigate("/location");
        return;
      }

      setUserData({
        username: parsedUser.username || "Guest",
        email: parsedUser.email || "guest@example.com",
        id: parsedUser.id || ""
      });
    } catch (error) {
      console.error("Error parsing user data:", error);
      navigate("/signup");
      return;
    }

    // Check if user is first login for onboarding modal
    const isFirstLogin = localStorage.getItem("isFirstLogin");
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");

    if (isFirstLogin === "true" && !hasSeenOnboarding) {
      setShowOnboarding(true);
      localStorage.setItem("hasSeenOnboarding", "true");
      localStorage.removeItem("isFirstLogin");
    }
  }, []);

  // Cart functions
  const handleAddToCart = (id: string) => {
    const menuItem = menuItems.find(item => item.id === id);
    if (!menuItem) return;
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity: 1
        };
        return [...prevItems, newItem];
      }
    });
    
    // Open cart sidebar on first add
    if (!cartItems.find(item => item.id === id)) {
      setIsCartOpen(true);
    }
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(id);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleClearAll = () => {
    setCartItems([]);
  };

  const handleConfirmPayment = (paymentMethod: string) => {
    if (cartItems.length === 0) return;

    // Format cart items menjadi order history format
    const newOrders = cartItems.map(item => ({
      id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: item.name,
      image: item.image,
      addOns: [], // Untuk sekarang kosong, bisa dikembangkan nanti
      price: item.price * item.quantity,
      quantity: item.quantity,
      date: new Date().toISOString(),
      status: "Done" as const // Langsung set sebagai Done untuk riwayat
    }));

    // Ambil order history yang sudah ada
    const existingOrders = JSON.parse(localStorage.getItem("orderHistory") || "[]");
    
    // Gabungkan dengan pesanan baru
    const updatedOrders = [...existingOrders, ...newOrders];
    
    // Simpan ke localStorage
    localStorage.setItem("orderHistory", JSON.stringify(updatedOrders));

    alert(`Pembayaran berhasil via ${paymentMethod}! Pesanan Anda sedang diproses.`);
    setCartItems([]);
    setIsCartOpen(false);
    setNote("");
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesFilter =
      activeFilter === "all" || item.category === activeFilter;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

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
            cartCount={cartCount} 
            onCartClick={() => setIsCartOpen(true)}
            onLogout={handleLogout}
          />

          {/* Filter Bar - Sticky */}
          <FilterBar
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Content */}
          <div className="p-6 pt-0">
            {/* Food Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => {
                const cartItem = cartItems.find(cartItem => cartItem.id === item.id);
                return (
                  <FoodCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    price={item.price}
                    image={item.image}
                    available={item.available}
                    quantity={cartItem?.quantity}
                    onAddToCart={handleAddToCart}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No menu items found
                </p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearAll={handleClearAll}
        deliverAddress={deliverAddress}
        onUpdateAddress={setDeliverAddress}
        note={note}
        onUpdateNote={setNote}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
};

export default Index;
