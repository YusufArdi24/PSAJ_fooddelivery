import { Menu, X, LayoutDashboard, ShoppingBag, Settings, LogOut } from "lucide-react";
import { useState } from "react";
import Logo from "../assets/Logo_edindelivery_.png";

interface MobileSidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const MobileSidebar = ({ activeItem, onItemClick }: MobileSidebarProps) => {
  const [isOpen, setIsOpen] = useState(false);

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
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6 text-foreground" />
        </button>

        <div className="flex items-center">
          <img 
            src={Logo} 
            alt="Edin Delivery Logo" 
            className="h-10 w-auto object-contain"
          />
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-foreground/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-sidebar transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
          <div className="flex items-center justify-center">
            <img 
              src={Logo} 
              alt="Edin Delivery Logo" 
              className="h-10 w-auto object-contain"
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
      </div>
    </>
  );
};

export default MobileSidebar;