import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ArrowLeft, MapPin, Loader } from "lucide-react";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export default function LocationConfirmation() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [editedAddress, setEditedAddress] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser ini");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Simulate reverse geocoding (normally would call a real geocoding API)
          const mockAddress = await reverseGeocode(latitude, longitude);
          setLocationData(mockAddress);
          setEditedAddress(mockAddress.address);
        } catch (err) {
          setError("Gagal mendapatkan alamat dari koordinat");
        } finally {
          setIsLoading(false);
        }
      },
      (error: GeolocationPositionError) => {
        setError(getGeolocationError(error.code));
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const reverseGeocode = (lat: number, lng: number): Promise<LocationData> => {
    // Simulate API call delay
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock data - in real app this would be actual reverse geocoding
        resolve({
          latitude: lat,
          longitude: lng,
          address: "Perumahan Griya Satria Sumampir, Jl. Aquamarine Blok H No. 6, Sumampir, Purwokerto Utara, Banyumas, Jawa Tengah, Indonesia, 53125",
          city: "Purwokerto",
          country: "Indonesia"
        });
      }, 2000);
    });
  };

  const getGeolocationError = (errorCode: number): string => {
    switch (errorCode) {
      case 1:
        return "Izin akses lokasi ditolak. Silakan aktifkan GPS dan berikan izin.";
      case 2:
        return "Lokasi tidak tersedia. Pastikan GPS aktif.";
      case 3:
        return "Timeout. Coba lagi atau pilih 'Enter Manually'.";
      default:
        return "Terjadi kesalahan saat mengakses lokasi.";
    }
  };

  const handleConfirm = () => {
    if (!locationData || !editedAddress.trim()) {
      return;
    }

    // Simpan data lokasi ke localStorage (nanti akan ke backend)
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userAddress = {
      userId: currentUser.id,
      address: editedAddress.trim(),
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      city: locationData.city,
      country: locationData.country,
      isDefault: true,
      createdAt: new Date().toISOString()
    };

    // Save address to user data
    currentUser.address = editedAddress.trim();
    currentUser.hasAddress = true;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    
    // Save detailed location data
    localStorage.setItem("userLocation", JSON.stringify(userAddress));

    // Redirect to dashboard
    localStorage.removeItem("isFirstLogin");
    navigate("/dashboard");
  };

  const handleBack = () => {
    navigate("/location");
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Gagal Mengakses Lokasi</h2>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <div className="space-y-3">
            <Button
              onClick={getCurrentLocation}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Coba Lagi
            </Button>
            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full border-border text-foreground hover:bg-muted"
            >
              Kembali
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <Loader className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Mengambil Lokasi Anda</h2>
            <p className="text-muted-foreground">Harap tunggu sebentar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Pilih Lokasi</h1>
          </div>

          {/* Map Preview */}
          <div className="mb-8">
            <div className="w-full h-64 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl relative overflow-hidden border border-border">
              {/* Mock map background */}
              <div className="absolute inset-0 opacity-30">
                <svg className="w-full h-full" viewBox="0 0 400 256" fill="none">
                  <path d="M0 80 L100 40 L200 60 L300 30 L400 50 L400 256 L0 256 Z" fill="#fb923c" />
                  <path d="M0 140 L80 110 L160 130 L240 100 L320 120 L400 110 L400 256 L0 256 Z" fill="#f97316" />
                  <path d="M0 200 L100 170 L200 190 L300 160 L400 180 L400 256 L0 256 Z" fill="#ea580c" />
                </svg>
              </div>
              
              {/* Active Pin */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="relative">
                  <div className="w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-red-500"></div>
                </div>
              </div>

              {/* Coordinates display */}
              {locationData && (
                <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-sm">
                  <div className="text-gray-600">
                    {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Address Form */}
          <div className="space-y-6">
            <div>
              <Label htmlFor="address" className="text-base font-medium text-foreground mb-3 block">
                Deliver Address
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  id="address"
                  value={editedAddress}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedAddress(e.target.value)}
                  placeholder="Alamat pengiriman"
                  className="pl-12 py-4 text-base border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Anda dapat mengedit alamat di atas jika perlu menambahkan detail lebih lanjut
              </p>
            </div>

            <Button
              onClick={handleConfirm}
              disabled={!editedAddress.trim()}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}