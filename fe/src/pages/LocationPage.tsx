import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { MapPin, ArrowLeft } from "lucide-react";
import { getAccessToken } from "../lib/api";

export default function LocationPage() {
  const navigate = useNavigate();
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const isAuthenticated = !!getAccessToken();
    // Pending registration flow: no token yet but wdn_pt exists
    const isPendingFlow   = !!localStorage.getItem('wdn_pt');
    const isFirstLogin    = localStorage.getItem('isFirstLogin');

    if (!isAuthenticated && !isPendingFlow) {
      navigate('/signin');
      return;
    }

    if (isFirstLogin === 'true' || isPendingFlow) {
      setIsNewUser(true);
    } else {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleEnterManually = () => {
    navigate("/manual-address");
  };

  if (!isNewUser) {
    return null;
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="h-full flex flex-col px-4 py-6">
        {/* Back + Header (mobile only) */}
        <div className="lg:hidden flex items-center gap-3 mb-4 flex-shrink-0">
          <Button
            onClick={() => navigate('/complete-profile')}
            variant="ghost"
            size="sm"
            className="p-2 hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Set Lokasi</h1>
        </div>
        <div className="flex-1 grid lg:grid-cols-2 gap-6 items-center overflow-hidden">
          {/* Left Column - Content */}
          <div className="space-y-4 sm:space-y-6">
            {/* Map Illustration */}
            <div className="flex justify-center">
              <div className="w-full max-w-xs sm:w-80 h-60 bg-gradient-to-br from-orange-100 to-orange-200 rounded-3xl relative overflow-hidden">
                {/* Simple map pattern */}
                <div className="absolute inset-0 opacity-20">
                  <svg className="w-full h-full" viewBox="0 0 320 240" fill="none">
                    <path d="M0 60 L80 30 L160 50 L240 20 L320 40 L320 240 L0 240 Z" fill="#fb923c" />
                    <path d="M0 120 L60 90 L120 110 L180 80 L240 100 L320 90 L320 240 L0 240 Z" fill="#f97316" />
                    <path d="M0 180 L80 150 L160 170 L240 140 L320 160 L320 240 L0 240 Z" fill="#ea580c" />
                  </svg>
                </div>
                
                {/* Location Pin */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-1 h-6 bg-red-500"></div>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-3 h-3 bg-white rounded-full opacity-60"></div>
                <div className="absolute bottom-4 left-4 w-2 h-2 bg-white rounded-full opacity-40"></div>
                <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-orange-300 rounded-full"></div>
              </div>
            </div>

            {/* Content */}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Isi Lokasimu
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Selamat datang di Edin Delivery! Untuk memberikan pengalaman terbaik, 
                kami perlu mengetahui lokasi Anda untuk pengiriman yang akurat.
              </p>
            </div>

            {/* Buttons */}
            <div className="space-y-4 max-w-md mx-auto">
              <Button
                onClick={handleEnterManually}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Ayo Mulai!
              </Button>
            </div>
          </div>

          {/* Right Column - Illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-lg">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-50 to-orange-100 rounded-3xl transform rotate-3"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-orange-150 rounded-3xl transform -rotate-2"></div>
              
              {/* Main illustration container */}
              <div className="relative bg-white rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                  {/* Header illustration */}
                  <div className="flex items-center justify-center">
                    <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  {/* Decorative map lines */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-4 h-4 bg-orange-200 rounded-full"></div>
                      <div className="h-2 bg-gradient-to-r from-orange-200 to-transparent rounded-full flex-1"></div>
                    </div>
                    <div className="flex items-center gap-4 ml-8">
                      <div className="w-4 h-4 bg-orange-300 rounded-full"></div>
                      <div className="h-2 bg-gradient-to-r from-orange-300 to-transparent rounded-full flex-1"></div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                      <div className="h-2 bg-gradient-to-r from-orange-400 to-transparent rounded-full flex-1"></div>
                    </div>
                  </div>

                  {/* Location cards */}
                  <div className="space-y-3">
                    <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-orange-200 rounded w-24"></div>
                          <div className="h-2 bg-orange-100 rounded w-32"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-200 rounded w-20"></div>
                          <div className="h-2 bg-gray-100 rounded w-28"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}