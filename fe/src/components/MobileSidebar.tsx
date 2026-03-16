import { X, LayoutDashboard, ShoppingBag, Settings, LogOut, ChefHat, UtensilsCrossed, Coffee, Croissant } from "lucide-react";
import Logo from "/warungedin.png";

interface MobileSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileSidebar = ({ activeItem, onItemClick, isOpen, onOpenChange }: MobileSidebarProps) => {
  const setIsOpen = onOpenChange;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Pesanan", icon: ShoppingBag },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  const handleItemClick = (item: string) => {
    onItemClick(item);
    setIsOpen(false);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-foreground/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-sidebar flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="py-1 px-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center justify-center">
            <img 
              src={Logo} 
              alt="Edin Delivery Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`nav-item w-full ${
                activeItem === item.id ? "nav-item-active" : ""
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          <button
            onClick={() => handleItemClick("logout")}
            className="nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </nav>

        {/* Art Panel */}
        <div className="p-4 mt-auto">
          <div className="relative h-44 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50 border border-orange-100">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white/40 to-yellow-50/60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-bounce" style={{ animationDuration: '3s' }}>
                <ChefHat size={44} className="text-orange-500" strokeWidth={1.5} />
              </div>
            </div>
            <div className="absolute top-3 left-4 animate-pulse" style={{ animationDuration: '2s' }}>
              <UtensilsCrossed size={22} className="text-orange-400/70" strokeWidth={1.5} />
            </div>
            <div className="absolute top-3 right-4 animate-pulse" style={{ animationDuration: '2.5s' }}>
              <Coffee size={20} className="text-amber-500/70" strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-10 left-5 animate-pulse" style={{ animationDuration: '3.5s' }}>
              <Croissant size={18} className="text-yellow-500/70" strokeWidth={1.5} />
            </div>
            <div className="absolute bottom-10 right-5 animate-pulse" style={{ animationDuration: '2.8s' }}>
              <UtensilsCrossed size={16} className="text-orange-300/70" strokeWidth={1.5} />
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-orange-200/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-orange-100/40 rounded-full" />
            <div className="absolute top-6 left-1/2 w-2 h-2 bg-orange-300/50 rounded-full animate-bounce" style={{ animationDuration: '2.2s' }} />
            <div className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-yellow-400/50 rounded-full animate-bounce" style={{ animationDuration: '1.8s' }} />
            <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 text-center">
              <p className="text-xs font-semibold text-orange-700">Warung Edin</p>
              <p className="text-[10px] text-orange-400/80">Lezat & Terpercaya</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSidebar;