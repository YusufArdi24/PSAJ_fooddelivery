import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import FilterBar from "../components/FilterBar";
import FoodCard from "../components/FoodCard";
import MobileSidebar from "../components/MobileSidebar";
import EmailVerificationModal from "../components/EmailVerificationModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";

import CartSidebar from "../components/CartSidebar";
import { useAuth } from "../contexts/AuthContext";
import { useMenu } from "../contexts/MenuContext";
import { toast } from "../components/ui/use-toast";
import { createOrder, OrderItem } from "../services/orderService";
import { getAvatarUrl } from "../services/customerService";

// Interfaces
interface CartItem {
  id: string;              // unique cart key: `${menuId}` or `${menuId}|${variant}`
  menuId: string;          // original MenuID string
  name: string;
  price: number;
  image: string;
  quantity: number;
  selected_variant?: string;
  variants?: string[];     // available options for this menu
}

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading: authLoading } = useAuth();
  const { 
    filteredMenus, 
    categories, 
    isLoading: menuLoading, 
    error: menuError,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery 
  } = useMenu();
  
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  
  // Cart states
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [deliverAddress, setDeliverAddress] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [note, setNote] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [variantPickerMenu, setVariantPickerMenu] = useState<{
    id: string;
    name: string;
    variants: string[];
  } | null>(null);
  
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

  useEffect(() => {
    // Check if user is authenticated
    if (authLoading) return;
    
    if (!user) {
      navigate("/signin");
      return;
    }

    // Set user address for delivery
    if (user.address) {
      setDeliverAddress(user.address);
    }
    if (user.address_label) {
      setAddressLabel(user.address_label);
    }
    if (user.address_notes) {
      setAddressNotes(user.address_notes);
    }

    // Check if user needs location setup
    if (!user.address) {
      navigate("/location");
      return;
    }

    // Show verification modal every time user accesses dashboard if not verified
    if (!user.is_verified) {
      setShowVerifyModal(true);
    }
  }, [user, authLoading, navigate]);

  // Handle reorder items from location state
  useEffect(() => {
    const state = location.state as { reorderItems?: any[], openCart?: boolean } | null;
    if (state?.reorderItems && Array.isArray(state.reorderItems)) {
      // Convert reorder items to cart items
      const newCartItems: CartItem[] = state.reorderItems.map(item => {
        const cartKey = item.selected_variant ? `${item.MenuID}|${item.selected_variant}` : item.MenuID.toString();
        return {
          id: cartKey,
          menuId: item.MenuID.toString(),
          name: item.menu_name,
          price: parseFloat(item.price),
          image: item.menu_image || '',
          quantity: parseInt(item.quantity) || 1,
          selected_variant: item.selected_variant,
          variants: item.variants ? JSON.parse(item.variants) : undefined,
        };
      });
      
      setCartItems(newCartItems);
      
      if (state.openCart) {
        setIsCartOpen(true);
      }
      
      // Clear location state to prevent re-adding on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Show loading state
  if (authLoading || menuLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show error state for menu loading
  if (menuError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">Gagal memuat menu</h3>
          <p className="text-gray-600 mb-4">{menuError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // Cart functions
  const handleAddToCart = (id: string) => {
    // Block unverified users from adding to cart
    if (!user?.is_verified) {
      setShowVerifyModal(true);
      toast({
        title: "Email Belum Diverifikasi",
        description: "Verifikasi email Anda terlebih dahulu untuk dapat memesan makanan.",
        variant: "destructive",
      });
      return;
    }

    const menuItem = filteredMenus.find(item => item.id === id);
    if (!menuItem) return;

    // If menu has variants, open picker dialog first
    if (menuItem.variants && menuItem.variants.length > 0) {
      setVariantPickerMenu({ id: menuItem.id, name: menuItem.name, variants: menuItem.variants });
      return;
    }

    // No variants — add directly
    addToCartDirect(id, undefined);
  };

  const addToCartDirect = (menuId: string, variant?: string) => {
    const menuItem = filteredMenus.find(item => item.id === menuId);
    if (!menuItem) return;

    const cartKey = variant ? `${menuId}|${variant}` : menuId;
    const isNewItem = !cartItems.find(item => item.id === cartKey);

    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === cartKey);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem: CartItem = {
          id: cartKey,
          menuId: menuId,
          name: menuItem.name,
          price: menuItem.price,
          image: menuItem.image,
          quantity: 1,
          selected_variant: variant,
          variants: menuItem.variants,
        };
        return [...prevItems, newItem];
      }
    });

    if (isNewItem) {
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

  // Change the selected variant of a cart item
  const handleUpdateVariant = (itemId: string, newVariant: string) => {
    setCartItems(prevItems => {
      const item = prevItems.find(i => i.id === itemId);
      if (!item) return prevItems;

      const newCartKey = `${item.menuId}|${newVariant}`;
      const existingWithNewVariant = prevItems.find(i => i.id === newCartKey);

      if (existingWithNewVariant) {
        // Merge: remove old entry, add quantity to existing
        return prevItems
          .filter(i => i.id !== itemId)
          .map(i => i.id === newCartKey ? { ...i, quantity: i.quantity + item.quantity } : i);
      } else {
        // Update id and selected_variant in place
        return prevItems.map(i =>
          i.id === itemId ? { ...i, id: newCartKey, selected_variant: newVariant } : i
        );
      }
    });
  };

  const handleConfirmPayment = async (paymentMethod: string) => {
    if (cartItems.length === 0) return;

    // Guard: require email verification
    if (!user?.is_verified) {
      setShowVerifyModal(true);
      toast({
        title: "Email Belum Diverifikasi",
        description: "Verifikasi email Anda terlebih dahulu untuk dapat memesan makanan.",
        variant: "destructive",
      });
      return;
    }

    // Guard: require phone number before placing order
    if (!user?.phone) {
      toast({
        title: "Nomor telepon belum diisi",
        description: "Tambahkan nomor telepon Anda sebelum membuat pesanan.",
        variant: "destructive",
      });
      navigate("/complete-profile");
      return;
    }

    // Guard: require delivery address
    if (!user?.address) {
      toast({
        title: "Alamat pengiriman belum diatur",
        description: "Atur lokasi pengiriman Anda terlebih dahulu.",
        variant: "destructive",
      });
      navigate("/location");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Convert cart items to order items
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        menu_id: item.menuId,
        quantity: item.quantity,
        selected_variant: item.selected_variant,
      }));

      // Create order via API
      const response = await createOrder({
        items: orderItems,
        payment_method: paymentMethod.toLowerCase().replace(/\s+/g, ""),
        notes: note || undefined,
        delivery_address: deliverAddress || undefined,
        delivery_address_label: addressLabel || undefined,
        delivery_address_notes: addressNotes || undefined,
      });

      if (response.success) {
        toast({
          title: "Pesanan berhasil dibuat!",
          description: `Pembayaran via ${paymentMethod} berhasil. Pesanan Anda sedang diproses.`,
        });

        // Clear cart
        setCartItems([]);
        setIsCartOpen(false);
        setNote("");
        // Reset delivery address to default
        if (user.address) {
          setDeliverAddress(user.address);
        }
        if (user.address_label) {
          setAddressLabel(user.address_label);
        } else {
          setAddressLabel("");
        }
        if (user.address_notes) {
          setAddressNotes(user.address_notes);
        } else {
          setAddressNotes("");
        }
      } else {
        toast({
          title: "Gagal membuat pesanan",
          description: response.message || "Terjadi kesalahan saat membuat pesanan.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Gagal membuat pesanan",
        description: error.message || "Terjadi kesalahan saat membuat pesanan.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Email Verification Modal */}
      {showVerifyModal && user && !user.is_verified && (
        <EmailVerificationModal
          email={user.email}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

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
              username: user?.name || "Guest",
              email: user?.email || "guest@example.com",
              id: user?.CustomerID?.toString() || "",
              avatar: user?.avatar ? getAvatarUrl(user.avatar) : undefined
            }}
            cartCount={cartCount} 
            onCartClick={() => setIsCartOpen(true)}
            onLogout={handleLogout}
            onMobileMenuOpen={() => setMobileMenuOpen(true)}
          />

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">
          {/* Filter Bar - Sticky */}
          <FilterBar
            activeFilter={selectedCategory}
            onFilterChange={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categories={categories}
          />

          {/* Content */}
          <div className="p-3 sm:p-6 pt-0">
            {/* Food Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
              {filteredMenus.map((item) => {
                // Sum quantity across all variants of this menu
                const totalQuantity = cartItems
                  .filter(ci => ci.menuId === item.id)
                  .reduce((sum, ci) => sum + ci.quantity, 0);
                return (
                  <FoodCard
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    price={item.price}
                    image={item.image}
                    available={item.available}
                    quantity={totalQuantity}
                    onAddToCart={handleAddToCart}
                    description={item.description}
                    hasPromo={item.hasPromo}
                    originalPrice={item.originalPrice}
                    discountedPrice={item.discountedPrice}
                    formattedDiscount={item.formattedDiscount}
                    isPopular={item.isPopular}
                    isRecommended={item.isRecommended}
                  />
                );
              })}
            </div>

            {/* Empty State */}
            {filteredMenus.length === 0 && !menuLoading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  {searchQuery ? 'Tidak ada menu yang sesuai dengan pencarian' : 'Tidak ada menu tersedia'}
                </p>
              </div>
            )}
          </div>
          </div>{/* end scrollable */}
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
        onUpdateVariant={handleUpdateVariant}
        deliverAddress={deliverAddress}
        onUpdateAddress={setDeliverAddress}
        addressLabel={addressLabel}
        onUpdateAddressLabel={setAddressLabel}
        addressNotes={addressNotes}
        onUpdateAddressNotes={setAddressNotes}
        note={note}
        onUpdateNote={setNote}
        onConfirmPayment={handleConfirmPayment}
        isPlacingOrder={isPlacingOrder}
      />

      {/* Variant Picker Dialog */}
      <Dialog open={!!variantPickerMenu} onOpenChange={() => setVariantPickerMenu(null)}>
        <DialogContent className="max-w-sm duration-300 data-[state=open]:zoom-in-75 data-[state=closed]:zoom-out-75">
          <DialogHeader>
            <DialogTitle>Pilih Varian</DialogTitle>
            <DialogDescription>{variantPickerMenu?.name}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {variantPickerMenu?.variants.map((variant, index) => (
              <button
                key={variant}
                onClick={() => {
                  addToCartDirect(variantPickerMenu.id, variant);
                  setVariantPickerMenu(null);
                }}
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
                className="animate-in fade-in zoom-in-90 slide-in-from-bottom-3 duration-200 p-3 border border-border rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors font-medium text-sm"
              >
                {variant}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
