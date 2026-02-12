import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Settings from "./pages/Settings";
import OrderHistory from "./pages/OrderHistory";
import LocationPage from "./pages/LocationPage";
import LocationConfirmation from "./pages/LocationConfirmation";
import ManualAddressForm from "./pages/ManualAddressForm";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component wrapper untuk halaman yang menggunakan theme
const ThemedRoute = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Auth pages tanpa theme */}
          <Route path="/" element={<SignUp />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          
          {/* Location onboarding pages */}
          <Route path="/location" element={<LocationPage />} />
          <Route path="/location-confirmation" element={<LocationConfirmation />} />
          <Route path="/manual-address" element={<ManualAddressForm />} />
          
          {/* Pages dengan theme */}
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
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;