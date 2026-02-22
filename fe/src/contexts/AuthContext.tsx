/**
 * Authentication Context for managing user authentication state
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  loginCustomer, 
  registerCustomer, 
  logoutCustomer, 
  getCustomerProfile,
  googleLoginCustomer,
  CustomerLoginData,
  CustomerRegisterData,
  AuthResponse 
} from '../services/authService';
import { 
  isAuthenticated, 
  getUserData, 
  removeAccessToken, 
  removeUserData 
} from '../lib/api';

// Types
interface User {
  CustomerID: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  address_label?: string;
  address_notes?: string;
  is_verified: boolean;
  avatar?: string;
  latitude?: number;
  longitude?: number;
}

interface AuthContextType {
  // State
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (data: CustomerLoginData) => Promise<AuthResponse>;
  loginWithGoogle: (credential: string) => Promise<AuthResponse>;
  register: (data: CustomerRegisterData) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props for AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh user function
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      if (!isAuthenticated()) return;
      
      const response = await getCustomerProfile();
      
      console.log('Refresh user response:', response);
      console.log('Response structure check:', {
        hasSuccess: response?.success !== undefined,
        hasData: response?.data !== undefined,
        hasCustomer: response?.data?.customer !== undefined,
        fullResponse: JSON.stringify(response)
      });
      
      // Check Laravel API response structure
      if (response?.success && response?.data?.customer) {
        console.log('Setting user data:', response.data.customer);
        setUser(response.data.customer);
      } else {
        console.error('Invalid response structure:', response);
        throw new Error(`Invalid profile response structure. Got: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // Just re-throw — callers (initializeAuth, etc.) decide whether to clear state.
      // Do NOT call logout() here: logout() fires a server request and wipes localStorage,
      // which breaks the flow when initializeAuth expects to fall back to cached data.
      throw error;
    }
  }, []);

  // ── Single-session security ───────────────────────────────────────────────
  // When the backend revokes the current token (new login on another device),
  // every subsequent API call returns 401. handleApiResponse in lib/api.ts
  // dispatches 'auth:session-expired'. We listen here and force a local logout
  // so the browser reflects the real authentication state.
  useEffect(() => {
    const handleSessionExpired = () => {
      console.warn('[Auth] Token revoked — logging out this session.');
      setUser(null);
      removeAccessToken();
      removeUserData();
      // Redirect to sign-in and let the user know what happened.
      window.location.href = '/signin?reason=session_expired';
    };

    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, []);

  // ── Visibility-change heartbeat ───────────────────────────────────────────
  // When the user switches back to this tab, silently re-verify the token.
  // If the token was revoked while the tab was hidden the 401 will trigger
  // 'auth:session-expired' (above) and force a logout automatically.
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isAuthenticated()) {
        try {
          await refreshUser();
        } catch {
          // A 401 already dispatched 'auth:session-expired'; nothing else to do.
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshUser]);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        if (!isAuthenticated()) {
          // No token at all — definitely not logged in
          setUser(null);
          return;
        }

        // Token exists. Try to get user data.
        // 1. Prefer cached localStorage data (instant, no network)
        const storedUser = getUserData();
        if (storedUser) {
          setUser(storedUser);
          // Silently refresh from server in the background.
          // If it fails for ANY reason, keep the cached data — do NOT clear the token.
          try {
            await refreshUser();
          } catch (_) {
            // Ignore — cached user stays, token stays.
          }
          return;
        }

        // 2. No cached user data — try fetching from server.
        try {
          const response = await getCustomerProfile();
          if (response?.success && response.data?.customer) {
            setUser(response.data.customer);
          } else {
            setUser(null);
          }
        } catch (_) {
          // Request failed (invalid token, network error, etc.)
          // Leave the token alone — autoVerify or another flow may have just stored
          // a fresh one. Just show the user as unauthenticated for now.
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []); // Empty dependency array is fine since we don't depend on external state

  // Login function
  const login = async (data: CustomerLoginData): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await loginCustomer(data);
      
      console.log('Login response in context:', response);
      
      // Set user from response.data.customer
      if (response.success && response.data && response.data.customer) {
        setUser(response.data.customer);
      }
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login function
  const loginWithGoogle = async (credential: string): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await googleLoginCustomer(credential);
      if (response.success && response.data && response.data.customer) {
        setUser(response.data.customer);
      }
      return response;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (data: CustomerRegisterData): Promise<AuthResponse> => {
    try {
      setIsLoading(true);
      const response = await registerCustomer(data);
      
      console.log('Register response in context:', response);
      
      // Set user from response.data.customer
      if (response.success && response.data && response.data.customer) {
        setUser(response.data.customer);
      }
      
      return response;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      console.log('Starting logout process...');
      setIsLoading(true);
      
      // Try to call server logout endpoint
      try {
        await logoutCustomer();
        console.log('Server logout successful');
      } catch (error) {
        console.warn('Server logout failed, clearing local data anyway:', error);
        // Continue with local cleanup even if server logout fails
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state regardless of server response
      console.log('Clearing local authentication data');
      setUser(null);
      removeAccessToken();
      removeUserData();
      setIsLoading(false);
      console.log('Logout complete');
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      // Redirect to login page
      window.location.href = '/signin';
      return null;
    }
    
    return <Component {...props} />;
  };
};