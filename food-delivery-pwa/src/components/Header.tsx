import { Calendar, Bell, ShoppingCart } from "lucide-react";
import ProfileDropdown from "./ProfileDropdown";

interface UserData {
  username: string;
  email: string;
  id?: string;
}

interface HeaderProps {
  userData: UserData;
  cartCount: number;
  onCartClick?: () => void;
  onLogout?: () => void;
}

const Header = ({ userData, cartCount, onCartClick, onLogout }: HeaderProps) => {
  const today = new Date();
  const formattedDate = today.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="bg-card border-b border-border border-b-[1px] px-6 py-6">
      <div className="flex items-center justify-between">
        {/* Greeting */}
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Halo, {userData.username}!
          </h2>
          <p className="text-sm text-muted-foreground">
            Hari baru, energi segar. Ayo mulai!
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Date */}
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formattedDate}</span>
          </div>

          {/* Notifications */}
          <button
  aria-label="Notifikasi"
  className="relative p-2 rounded-lg hover:bg-muted transition-colors"
>
  <Bell className="w-5 h-5 text-muted-foreground" />
</button>


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
