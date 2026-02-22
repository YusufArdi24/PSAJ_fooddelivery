import { useState, useCallback, useRef } from "react";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { MapPin, Navigation } from "lucide-react";

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface GoogleMapsLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  defaultLocation?: { lat: number; lng: number };
  apiKey: string;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
};

const defaultCenter = {
  lat: -6.2088,  // Jakarta, Indonesia
  lng: 106.8456
};

const libraries: ("places")[] = ["places"];

export default function GoogleMapsLocationPicker({
  onLocationSelect,
  defaultLocation,
  apiKey,
}: GoogleMapsLocationPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral>(
    defaultLocation || defaultCenter
  );
  const [searchBox, setSearchBox] = useState<google.maps.places.Autocomplete | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const onPlaceChanged = () => {
    if (searchBox !== null) {
      const place = searchBox.getPlace();
      if (place.geometry && place.geometry.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setSelectedPosition(location);
        setCurrentAddress(place.formatted_address || "");
        
        // Pan map to selected location
        if (mapRef.current) {
          mapRef.current.panTo(location);
          mapRef.current.setZoom(15);
        }
      }
    }
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setSelectedPosition({ lat, lng });
      
      // Reverse geocode to get address
      reverseGeocode(lat, lng);
    }
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({
        location: { lat, lng },
      });

      if (result.results[0]) {
        setCurrentAddress(result.results[0].formatted_address);
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
      setCurrentAddress(`${lat}, ${lng}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedPosition(location);
        
        // Pan map to current location
        if (mapRef.current) {
          mapRef.current.panTo(location);
          mapRef.current.setZoom(15);
        }
        
        // Get address
        reverseGeocode(location.lat, location.lng);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Gagal mendapatkan lokasi Anda");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleConfirmLocation = () => {
    onLocationSelect({
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
      address: currentAddress || `${selectedPosition.lat}, ${selectedPosition.lng}`,
    });
  };

  // Check if API key is provided
  if (!apiKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium mb-2">Google Maps API Key Required</p>
        <p className="text-sm text-yellow-600">
          Please set VITE_GOOGLE_MAPS_API_KEY in your .env file
        </p>
        <p className="text-xs text-yellow-500 mt-2">
          Get your API key from: console.cloud.google.com
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
        <div className="space-y-3">
          {/* Search Box */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Autocomplete
                onLoad={(autocomplete) => setSearchBox(autocomplete)}
                onPlaceChanged={onPlaceChanged}
              >
                <Input
                  type="text"
                  placeholder="Cari alamat atau tempat..."
                  className="w-full"
                />
              </Autocomplete>
            </div>
            <Button
              type="button"
              onClick={handleUseCurrentLocation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Lokasi Saya
            </Button>
          </div>

          {/* Map */}
          <div className="relative border-2 border-border rounded-xl overflow-hidden">
            <GoogleMap
              mapContainerStyle={containerStyle}
              center={selectedPosition}
              zoom={13}
              onLoad={onLoad}
              onUnmount={onUnmount}
              onClick={onMapClick}
              options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
              }}
            >
              <Marker position={selectedPosition} />
            </GoogleMap>
          </div>

          {/* Address Display */}
          <div className="bg-muted rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Alamat Terpilih:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isLoadingAddress ? (
                    <span className="inline-flex items-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></div>
                      Mendapatkan alamat...
                    </span>
                  ) : currentAddress || "Klik pada peta atau cari lokasi"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPosition.lat.toFixed(6)}, {selectedPosition.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <Button
            type="button"
            onClick={handleConfirmLocation}
            disabled={!currentAddress}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            Konfirmasi Lokasi
          </Button>
        </div>
      </LoadScript>
    </div>
  );
}
