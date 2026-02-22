/**
 * Menu Context for managing menu data and state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getMenus, 
  getMenuCategories,
  convertMenuToFrontendFormat 
} from '../services/menuService';

// Types for frontend compatibility
interface FrontendMenuItem {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
  category: string;
  description: string;
  // Promo fields
  hasPromo?: boolean;
  originalPrice?: number;
  discountedPrice?: number;
  formattedDiscount?: string;
  promoTitle?: string;
  // Variant options
  variants?: string[];
}

interface MenuContextType {
  // State
  menus: FrontendMenuItem[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  
  // Filters
  selectedCategory: string;
  searchQuery: string;
  
  // Actions
  refreshMenus: () => Promise<void>;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  getMenuById: (id: string) => FrontendMenuItem | undefined;
  
  // Computed values
  filteredMenus: FrontendMenuItem[];
}

// Create context
const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Props for MenuProvider
interface MenuProviderProps {
  children: ReactNode;
}

// MenuProvider component
export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [menus, setMenus] = useState<FrontendMenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load menus on mount
  useEffect(() => {
    refreshMenus();
  }, []);

  // Refresh menus when user returns to the tab (catches admin deletions/edits)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshMenus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Refresh menus function
  const refreshMenus = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Loading menus...');
      
      // Fetch menus and categories in parallel
      const [menusResponse, categoriesResponse] = await Promise.all([
        getMenus(),
        getMenuCategories(),
      ]);
      
      console.log('Menus response:', menusResponse);
      console.log('Categories response:', categoriesResponse);
      
      // Check if response is successful and has data
      if (menusResponse.success && menusResponse.data && menusResponse.data.data) {
        // Convert backend format to frontend format
        const convertedMenus = menusResponse.data.data.map(convertMenuToFrontendFormat);
        
        console.log('Converted menus:', convertedMenus);
        
        setMenus(convertedMenus);
        setCategories(['all', ...categoriesResponse]);
      } else {
        throw new Error('Invalid menu data received from API');
      }
      
    } catch (err) {
      console.error('Failed to load menus:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menus');
      setMenus([]); // Set empty array on error
      setCategories(['all']); // Set default categories
    } finally {
      setIsLoading(false);
    }
  };

  // Get menu by ID
  const getMenuById = (id: string): FrontendMenuItem | undefined => {
    return menus.find(menu => menu.id === id);
  };

  // Compute filtered menus based on category and search
  const filteredMenus = React.useMemo(() => {
    let filtered = menus;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(menu => menu.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(menu => 
        menu.name.toLowerCase().includes(query) ||
        menu.description.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [menus, selectedCategory, searchQuery]);

  // Auto-refresh menus periodically (optional)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMenus();
    }, 5 * 60 * 1000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Context value
  const value: MenuContextType = {
    menus,
    categories,
    isLoading,
    error,
    selectedCategory,
    searchQuery,
    refreshMenus,
    setSelectedCategory,
    setSearchQuery,
    getMenuById,
    filteredMenus,
  };

  return (
    <MenuContext.Provider value={value}>
      {children}
    </MenuContext.Provider>
  );
};

// Custom hook to use menu context
export const useMenu = (): MenuContextType => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
};

// Hook for getting specific menu category
export const useMenuCategory = (category: string) => {
  const { menus } = useMenu();
  
  return React.useMemo(() => {
    return menus.filter(menu => menu.category === category && menu.available);
  }, [menus, category]);
};

// Hook for menu search
export const useMenuSearch = (query: string) => {
  const { menus } = useMenu();
  
  return React.useMemo(() => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return menus.filter(menu => 
      menu.available && (
        menu.name.toLowerCase().includes(searchTerm) ||
        menu.description.toLowerCase().includes(searchTerm)
      )
    );
  }, [menus, query]);
};