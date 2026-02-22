import { Calendar, Menu, ShoppingCart } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";
import NotificationDropdown from "./NotificationDropdown";


interface UserData {
  username: string;
  email: string;
  id?: string;
  avatar?: string;
}

interface HeaderProps {
  userData: UserData;
  cartCount: number;
  onCartClick?: () => void;
  onLogout?: () => void;
  onMobileMenuOpen?: () => void;
}

const Header = ({ userData, cartCount, onCartClick, onLogout, onMobileMenuOpen }: HeaderProps) => {
  console.log('[Header] userData:', userData);
  console.log('[Header] userData.avatar:', userData.avatar);
  
  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="bg-card border-b border-border border-b-[1px] px-4 sm:px-6 flex items-center" style={{ height: '72px' }}>
      <div className="flex items-center justify-between gap-2 w-full">
        {/* Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger - mobile only */}
          {onMobileMenuOpen && (
            <button
              onClick={onMobileMenuOpen}
              className="lg:hidden p-1.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 text-foreground" />
            </button>
          )}
          <div className="min-w-0">
          <h2 className="text-sm sm:text-xl font-semibold text-foreground truncate">
            Halo, {userData.username}!
          </h2>
          <p className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">
            Mau makan apa nih hari ini?
          </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
          {/* Date */}
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>

          {/* Notifications */}
          <NotificationDropdown />

          {/* Cart */}
          <button 
            onClick={onCartClick}
            className="relative p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs font-medium rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <ProfileDropdown userData={userData} onLogout={onLogout} />
        </div>
      </div>
    </header>
  );
};

export default Header;
