import { useState } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MenuProvider } from "./contexts/MenuContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import AnimatedPage from "./components/AnimatedPage";
import SplashScreen from "./components/SplashScreen";
import Dashboard from "./pages/Dashboard";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Settings from "./pages/Settings";
import OrderHistory from "./pages/OrderHistory";
import LocationPage from "./pages/LocationPage";
import LocationConfirmation from "./pages/LocationConfirmation";
import ManualAddressForm from "./pages/ManualAddressForm";
import CompleteProfile from "./pages/CompleteProfile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import PaymentFinish from "./pages/PaymentFinish";
import PaymentPending from "./pages/PaymentPending";
import PaymentError from "./pages/PaymentError";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component wrapper untuk halaman yang menggunakan theme
const ThemedRoute = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

// Component untuk animated routes
const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Animate auth + onboarding pages
  const isAnimatedPage = location.pathname === '/' || 
                          location.pathname === '/signup' || 
                          location.pathname === '/signin' ||
                          location.pathname === '/complete-profile' ||
                          location.pathname === '/location' ||
                          location.pathname === '/location-confirmation' ||
                          location.pathname === '/manual-address' ||
                          location.pathname === '/forgot-password' ||
                          location.pathname === '/reset-password' ||
                          location.pathname === '/verify-email';

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={isAnimatedPage ? location.pathname : 'static'}>
        {/* Auth pages with animation */}
        <Route path="/" element={<AnimatedPage><SignUp /></AnimatedPage>} />
        <Route path="/signup" element={<AnimatedPage><SignUp /></AnimatedPage>} />
        <Route path="/signin" element={<AnimatedPage><SignIn /></AnimatedPage>} />
        
        {/* Location onboarding pages - with animation */}
        <Route path="/location" element={<AnimatedPage><LocationPage /></AnimatedPage>} />
        <Route path="/location-confirmation" element={<AnimatedPage><LocationConfirmation /></AnimatedPage>} />
        <Route path="/manual-address" element={<AnimatedPage><ManualAddressForm /></AnimatedPage>} />
        <Route path="/complete-profile" element={<AnimatedPage><CompleteProfile /></AnimatedPage>} />
        <Route path="/forgot-password" element={<AnimatedPage><ForgotPassword /></AnimatedPage>} />
        <Route path="/reset-password" element={<AnimatedPage><ResetPassword /></AnimatedPage>} />
        <Route path="/verify-email" element={<AnimatedPage><VerifyEmail /></AnimatedPage>} />
        
        {/* Pages dengan theme - no animation */}
        <Route 
          path="/dashboard" 
          element={
            <ThemedRoute>
              <Dashboard />
            </ThemedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ThemedRoute>
              <Settings />
            </ThemedRoute>
          } 
        />
        <Route 
          path="/order-history" 
          element={
            <ThemedRoute>
              <OrderHistory />
            </ThemedRoute>
          } 
        />
        
        {/* Payment pages - no animation */}
        <Route 
          path="/payment/finish" 
          element={
            <ThemedRoute>
              <PaymentFinish />
            </ThemedRoute>
          } 
        />
        <Route 
          path="/payment/pending" 
          element={
            <ThemedRoute>
              <PaymentPending />
            </ThemedRoute>
          } 
        />
        <Route 
          path="/payment/error" 
          element={
            <ThemedRoute>
              <PaymentError />
            </ThemedRoute>
          } 
        />
        
        {/* 404 page - no animation */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per browser session
    return !sessionStorage.getItem("splashShown");
  });

  const handleSplashDone = () => {
    sessionStorage.setItem("splashShown", "1");
    setShowSplash(false);
  };

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <MenuProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {showSplash && <SplashScreen onDone={handleSplashDone} />}
                <BrowserRouter>
                  <AnimatedRoutes />
                </BrowserRouter>
              </TooltipProvider>
            </MenuProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
};

export default App;