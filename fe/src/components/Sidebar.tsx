import { LayoutDashboard, ShoppingBag, Settings, LogOut, ChefHat, UtensilsCrossed, Coffee, Croissant } from "lucide-react";
import Logo from "../assets/warungedin.png";

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
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-screen">
      {/* Logo */}
      <div className="px-2 border-b border-border border-b-[1px] flex items-center justify-center lg:justify-start" style={{ height: '72px' }}>
        <img 
          src={Logo} 
          alt="Edin Delivery Logo" 
          className="h-16 w-auto max-w-full object-contain"
        />
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

      {/* Art Panel - like SignIn right panel */}
      <div className="p-4">
        <div className="relative h-44 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50 border border-orange-100">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white/40 to-yellow-50/60" />

          {/* Floating icons */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Center Chef Hat */}
            <div className="animate-bounce" style={{ animationDuration: '3s' }}>
              <ChefHat size={44} className="text-orange-500" strokeWidth={1.5} />
            </div>
          </div>

          {/* Floating utensils - top left */}
          <div className="absolute top-3 left-4 animate-pulse" style={{ animationDuration: '2s' }}>
            <UtensilsCrossed size={22} className="text-orange-400/70" strokeWidth={1.5} />
          </div>

          {/* Coffee - top right */}
          <div className="absolute top-3 right-4 animate-pulse" style={{ animationDuration: '2.5s' }}>
            <Coffee size={20} className="text-amber-500/70" strokeWidth={1.5} />
          </div>

          {/* Croissant - bottom left */}
          <div className="absolute bottom-10 left-5 animate-pulse" style={{ animationDuration: '3.5s' }}>
            <Croissant size={18} className="text-yellow-500/70" strokeWidth={1.5} />
          </div>

          {/* Utensils - bottom right */}
          <div className="absolute bottom-10 right-5 animate-pulse" style={{ animationDuration: '2.8s' }}>
            <UtensilsCrossed size={16} className="text-orange-300/70" strokeWidth={1.5} />
          </div>

          {/* Decorative circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-orange-200/30 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-orange-100/40 rounded-full" />

          {/* Small dots */}
          <div className="absolute top-6 left-1/2 w-2 h-2 bg-orange-300/50 rounded-full animate-bounce" style={{ animationDuration: '2.2s' }} />
          <div className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-yellow-400/50 rounded-full animate-bounce" style={{ animationDuration: '1.8s' }} />

          {/* Bottom text */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 text-center">
            <p className="text-xs font-semibold text-orange-700">Warung Edin</p>
            <p className="text-[10px] text-orange-400/80">Lezat & Terpercaya</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
