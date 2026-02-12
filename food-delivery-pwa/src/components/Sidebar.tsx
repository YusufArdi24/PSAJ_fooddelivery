import { LayoutDashboard, ShoppingBag, Settings, LogOut, Star } from "lucide-react";
import Logo from "../assets/Logo_edindelivery_.png";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const Sidebar = ({ activeItem, onItemClick }: SidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "orders", label: "Pesanan", icon: ShoppingBag },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border border-b-[1px]">
        <div className="flex items-center justify-center lg:justify-start">
          <img 
            src={Logo} 
            alt="Edin Delivery Logo" 
            className="h-14 w-auto max-w-full object-contain"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={`nav-item w-full ${
              activeItem === item.id ? "nav-item-active" : ""
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}

        <button
          onClick={() => onItemClick("logout")}
          className="nav-item w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Keluar</span>
        </button>
      </nav>

      {/* Review Card */}
      <div className="p-4">
        <div className="bg-accent rounded-xl p-4 relative">
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Star className="w-6 h-6 text-primary-foreground fill-primary-foreground" />
            </div>
          </div>
          <div className="pt-6 text-center">
            <h3 className="font-semibold text-accent-foreground mb-1">Leave a Review</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Share your experience on Google Maps to help us improve our service
            </p>
            <button className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              Write Review
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
