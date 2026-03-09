import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "./ui/button";
import { MapPin, Navigation } from "lucide-react";

// Fix Leaflet icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface LeafletLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  defaultLocation?: { lat: number; lng: number };
  mapHeight?: string;
  compact?: boolean;
}

const defaultCenter = {
  lat: -6.2088, // Jakarta, Indonesia
  lng: 106.8456,
};

// Komponen untuk handle map click
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Komponen untuk mengekspos instance map ke parent via ref
function MapController({ mapRef }: { mapRef: React.MutableRefObject<LeafletMap | null> }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

export default function LeafletLocationPicker({
  onLocationSelect,
  defaultLocation,
  mapHeight = "h-44 sm:h-64 lg:h-96",
  compact = false,
}: LeafletLocationPickerProps) {
  const [selectedPosition, setSelectedPosition] = useState<{ lat: number; lng: number }>(
    defaultLocation || defaultCenter
  );
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [mapCenter] = useState<[number, number]>([
    defaultLocation?.lat || defaultCenter.lat,
    defaultLocation?.lng || defaultCenter.lng,
  ]);
  const mapRef = useRef<LeafletMap | null>(null);

  // Auto-confirm: propagate selection whenever address resolves
  useEffect(() => {
    if (!isLoadingAddress && currentAddress) {
      onLocationSelect({
        latitude: selectedPosition.lat,
        longitude: selectedPosition.lng,
        address: currentAddress,
      });
    }
  }, [currentAddress, isLoadingAddress]);

  // Reverse geocode menggunakan Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=19&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "id",
          },
        }
      );
      const data = await response.json();
      
      if (data.address) {
        // Build detailed address from components for maximum specificity
        const a = data.address;
        const parts: string[] = [];
        // Most specific first: building name, amenity, tourism, etc.
        if (a.amenity) parts.push(a.amenity);
        if (a.tourism) parts.push(a.tourism);
        if (a.building) parts.push(a.building);
        // Neighbourhood / residential area (perumahan)
        if (a.residential) parts.push(a.residential);
        if (a.neighbourhood) parts.push(a.neighbourhood);
        if (a.quarter) parts.push(a.quarter);
        if (a.hamlet) parts.push(a.hamlet);
        // Road / house number
        if (a.road || a.street) parts.push([a.house_number, a.road || a.street].filter(Boolean).join(" "));
        // Village / suburb
        if (a.village || a.suburb || a.town) parts.push(a.village || a.suburb || a.town);
        // District / city
        if (a.subdistrict) parts.push(a.subdistrict);
        if (a.city_district || a.district) parts.push(a.city_district || a.district);
        if (a.city || a.county) parts.push(a.city || a.county);
        // Province & postcode
        if (a.state) parts.push(a.state);
        if (a.postcode) parts.push(a.postcode);
        if (a.country) parts.push(a.country);

        const builtAddress = parts.filter(Boolean).join(", ");
        setCurrentAddress(builtAddress || data.display_name);
      } else if (data.display_name) {
        setCurrentAddress(data.display_name);
      } else {
        setCurrentAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error("Reverse geocode error:", error);
      setCurrentAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  // Handle map click
  const handleMapClick = (lat: number, lng: number) => {
    setSelectedPosition({ lat, lng });
    reverseGeocode(lat, lng);
  };

  // Get current location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setSelectedPosition(location);
        reverseGeocode(location.lat, location.lng);
        mapRef.current?.flyTo([location.lat, location.lng], 15, { animate: true, duration: 1 });
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
        alert("Gagal mendapatkan lokasi Anda. Pastikan Anda memberikan izin lokasi.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Load initial address
  useEffect(() => {
    if (defaultLocation) {
      reverseGeocode(defaultLocation.lat, defaultLocation.lng);
    }
  }, []);

  return (
    <div className="space-y-4">
      {/* Lokasi Saya Button */}
      <Button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isLocating}
        variant="outline"
        className={`flex items-center gap-2 w-full ${compact ? "h-8 text-xs" : ""}`}
      >
        {isLocating ? (
          <>
            <div className={`animate-spin rounded-full border-b-2 border-current ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
            Mendapatkan Lokasi...
          </>
        ) : (
          <>
            <Navigation className={compact ? "w-3 h-3" : "w-4 h-4"} />
            Gunakan Lokasi Saya
          </>
        )}
      </Button>

      {/* Map */}
      <div className={`relative border-border rounded-xl overflow-hidden ${mapHeight} ${compact ? "border" : "border-2"}`}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[selectedPosition.lat, selectedPosition.lng]} />
          <MapClickHandler onClick={handleMapClick} />
          <MapController mapRef={mapRef} />
        </MapContainer>
      </div>

      {/* Address Display */}
      <div className={`bg-muted rounded-lg ${compact ? "p-2" : "p-4"}`}>
        <div className={`flex items-start ${compact ? "gap-2" : "gap-3"}`}>
          <MapPin className={`text-orange-500 mt-0.5 flex-shrink-0 ${compact ? "w-4 h-4" : "w-5 h-5"}`} />
          <div className="flex-1">
            <p className={`font-medium text-foreground ${compact ? "text-xs" : "text-sm"}`}>Alamat Terpilih:</p>
            <p className={`text-muted-foreground mt-1 ${compact ? "text-xs" : "text-sm"}`}>
              {isLoadingAddress ? (
                <span className="inline-flex items-center gap-2">
                  <div className={`animate-spin rounded-full border-b-2 border-orange-500 ${compact ? "h-2.5 w-2.5" : "h-3 w-3"}`}></div>
                  Mendapatkan alamat...
                </span>
              ) : (
                currentAddress || "Klik pada peta atau cari lokasi"
              )}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
