import { useState, useRef, useEffect } from "react";
import { ChevronDown, Moon, Sun, LogOut, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

interface UserData {
  username: string;
  email: string;
  id?: string;
  avatar?: string;
}

interface ProfileDropdownProps {
  userData: UserData;
  onLogout?: () => void | Promise<void>;
}

const ProfileDropdown = ({ userData, onLogout }: ProfileDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  console.log('[ProfileDropdown] userData.avatar:', userData.avatar);

  // Reset image error when avatar URL changes
  useEffect(() => {
    setImageError(false);
  }, [userData.avatar]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isFirstLogin");
    localStorage.removeItem("hasSeenOnboarding");
    setIsOpen(false);
    try {
      if (onLogout) {
        await onLogout();
      } else {
        navigate("/signup");
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 pl-4 border-l border-border hover:bg-muted/50 rounded-lg transition-colors p-2"
      >
        <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center">
          {userData.avatar && !imageError ? (
            <img 
              src={userData.avatar} 
              alt="Profile" 
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              onError={() => {
                console.error('[ProfileDropdown] Image failed to load:', userData.avatar);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('[ProfileDropdown] Image loaded successfully:', userData.avatar);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {userData.username?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          )}
        </div>
        <span className="hidden md:block text-sm font-medium text-foreground">
          {userData.username}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* User Info Section */}
            <div className="p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                  {userData.avatar && !imageError ? (
                    <img 
                      src={userData.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                      onError={() => {
                        console.error('[ProfileDropdown-Dropdown] Image failed to load:', userData.avatar);
                        setImageError(true);
                      }}
                      onLoad={() => {
                        console.log('[ProfileDropdown-Dropdown] Image loaded successfully:', userData.avatar);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <span className="text-lg font-medium text-primary">
                        {userData.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {userData.username}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {userData.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {/* Theme Toggle */}
              <div className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {theme === "light" ? (
                      <Sun className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Moon className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="text-sm text-foreground">Tampilan</span>
                  </div>
                  
                  {/* Custom Toggle Switch */}
                  <button
                    onClick={toggleTheme}
                    className="relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent bg-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary"
                    data-state={theme === "dark" ? "checked" : "unchecked"}
                  >
                    <span className="sr-only">Toggle theme</span>
                    <span
                      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                        theme === "dark" ? "translate-x-5" : "translate-x-0"
                      }`}
                    >
                      <span className="flex items-center justify-center h-full w-full">
                        {theme === "light" ? (
                          <Sun className="w-3 h-3 text-muted-foreground" />
                        ) : (
                          <Moon className="w-3 h-3 text-muted-foreground" />
                        )}
                      </span>
                    </span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-7">
                  {theme === "light" ? "Mode terang" : "Mode gelap"}
                </p>
              </div>

              {/* Separator */}
              <div className="h-px bg-border my-2" />

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                {isLoggingOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileDropdown;