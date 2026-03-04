import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import { Button } from "../components/ui/button";
import { Loader, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import "leaflet/dist/leaflet.css";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom user markers
const createUserMarkerIcon = (isWithinArea: boolean) => {
  return new L.Icon({
    iconUrl: isWithinArea 
      ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png'
      : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};


interface LocationState {
  latitude: number | null;
  longitude: number | null;
  isWithinServiceArea: boolean | null;
  isLoading: boolean;
  error: string;
  permissionDenied: boolean;
}

// Service area polygon for Bukit Kalibagor Indah
// Based on center coordinates: -7.4857433, 109.2945344
const serviceArea = [
  [-7.483596, 109.293871], // Barat Laut (kejauhan)                         
  [-7.484170, 109.298047], // Timur Laut (kejauhan)                        
  [-7.486748, 109.296254], // Timur Selatan (kejauhan)                      
  [-7.485928, 109.293061]  // Barat Selatan (kejauhan)      
] as [number, number][];

// Center point of the service area
const serviceCenter: [number, number] = [-7.4857433, 109.2945344];

// Calculate map bounds to show both user location and service area
const calculateMapBounds = (userLat: number, userLng: number) => {
  const allPoints = [
    ...serviceArea,
    [userLat, userLng] as [number, number]
  ];
  
  const lats = allPoints.map(point => point[0]);
  const lngs = allPoints.map(point => point[1]);
  
  return [
    [Math.min(...lats) - 0.005, Math.min(...lngs) - 0.005],
    [Math.max(...lats) + 0.005, Math.max(...lngs) + 0.005]
  ] as [[number, number], [number, number]];
};

export default function GeoFencing() {
  const navigate = useNavigate();
  const [locationState, setLocationState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    isWithinServiceArea: null,
    isLoading: true,
    error: "",
    permissionDenied: false,
  });

  useEffect(() => {
    checkUserLocation();
  }, []);

  // Point in polygon algorithm
  const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [xi, yi] = polygon[i];
      const [xj, yj] = polygon[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  };

  // Calculate distance between two coordinates (Haversine formula)
  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const checkUserLocation = () => {
    setLocationState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: "", 
      permissionDenied: false 
    }));

    if (!navigator.geolocation) {
      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        error: "Browser Anda tidak mendukung geolocation. Silakan gunakan browser yang lebih modern.",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userPoint: [number, number] = [latitude, longitude];
        const isWithinArea = isPointInPolygon(userPoint, serviceArea);
        
        setLocationState(prev => ({
          ...prev,
          latitude,
          longitude,
          isWithinServiceArea: isWithinArea,
          isLoading: false,
        }));

        // If user is within service area, redirect to signup after 3 seconds
        if (isWithinArea) {
          setTimeout(() => {
            navigate("/signup");
          }, 3000);
        }
      },
      (error) => {
        let errorMessage = "";
        let permissionDenied = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak. Silakan berikan izin akses lokasi dan coba lagi.";
            permissionDenied = true;
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Lokasi tidak tersedia. Pastikan GPS aktif dan sinyal kuat.";
            break;
          case error.TIMEOUT:
            errorMessage = "Timeout. Gagal mendapatkan lokasi dalam waktu yang ditentukan.";
            break;
          default:
            errorMessage = "Terjadi kesalahan saat mengakses lokasi.";
            break;
        }
        
        setLocationState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          permissionDenied,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  };

  const handleRetryLocation = () => {
    checkUserLocation();
  };

  const handleEnableLocation = () => {
    // Guide user to enable location in browser settings
    alert("Untuk mengaktifkan lokasi:\n\n1. Klik ikon gembok/info di sebelah URL\n2. Pilih 'Izinkan' untuk lokasi\n3. Refresh halaman ini\n\nAtau buka pengaturan browser dan izinkan akses lokasi untuk situs ini.");
  };

  // Loading state
  if (locationState.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-md">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Loader className="w-10 h-10 text-orange-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Memeriksa Lokasi Anda</h2>
            <p className="text-gray-600">Harap tunggu sebentar sementara kami memverifikasi lokasi Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (locationState.error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Gagal Mengakses Lokasi</h2>
            <p className="text-gray-600 mb-4">{locationState.error}</p>
          </div>
          <div className="space-y-3">
            {locationState.permissionDenied ? (
              <Button
                onClick={handleEnableLocation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                Cara Mengaktifkan Lokasi
              </Button>
            ) : null}
            <Button
              onClick={handleRetryLocation}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Access denied state (outside service area)
  if (locationState.isWithinServiceArea === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          {/* Map showing user location and service area */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6">
            <div className="h-64">
              {locationState.latitude && locationState.longitude && (
                <MapContainer
                  bounds={calculateMapBounds(locationState.latitude, locationState.longitude)}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {/* Service area polygon */}
                  <Polygon
                    positions={serviceArea}
                    pathOptions={{ 
                      fillColor: 'green', 
                      fillOpacity: 0.2, 
                      color: 'green', 
                      weight: 3 
                    }}
                  >
                    <Popup>Area Layanan Bukit Kalibagor Indah</Popup>
                  </Polygon>
                  
                  {/* Service center marker for reference */}
                  <Marker 
                    position={serviceCenter}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong className="text-green-600">🏠 Pusat Area Layanan</strong><br/>
                        <small className="text-gray-600">
                          Perumahan Bukit Kalibagor Indah<br/>
                          Lat: {serviceCenter[0].toFixed(6)}<br/>
                          Lng: {serviceCenter[1].toFixed(6)}
                        </small>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* User location marker - RED (outside area) */}
                  <Marker 
                    position={[locationState.latitude, locationState.longitude]}
                    icon={createUserMarkerIcon(false)}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong className="text-red-600">❌ Lokasi Anda</strong><br/>
                        <small className="text-gray-600">
                          Lat: {locationState.latitude.toFixed(6)}<br/>
                          Lng: {locationState.longitude.toFixed(6)}
                        </small><br/>
                        <span className="text-red-600 text-sm font-semibold">Di Luar Area Layanan</span>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              )}
            </div>
            
            {/* Location info bar */}
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2 text-center">
                📍 Jarak dari pusat area layanan: ~{locationState.latitude && locationState.longitude ? 
                  Math.round(getDistanceFromLatLonInKm(locationState.latitude, locationState.longitude, serviceCenter[0], serviceCenter[1]) * 1000)
                : 0}m
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-600">
                  <strong>Koordinat Anda:</strong>
                </div>
                <div className="text-gray-800 font-mono">
                  {locationState.latitude?.toFixed(6)}, {locationState.longitude?.toFixed(6)}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <div className="text-gray-600">
                  <strong>Status:</strong>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-red-600 font-semibold">Di Luar Area Layanan</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Access denied message */}
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Akses Ditolak</h2>
            <p className="text-gray-600 mb-6">
              Maaf, layanan delivery kami saat ini hanya tersedia untuk area Perumahan Bukit Kalibagor Indah. 
              Lokasi Anda berada di luar jangkauan layanan kami.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-800 mb-2">Area Layanan Kami:</h4>
              <p className="text-blue-700 text-sm">
                • Perumahan Bukit Kalibagor Indah
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleRetryLocation}
                variant="outline"
                className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Periksa Ulang Lokasi
              </Button>
              <p className="text-sm text-gray-500">
                Jika Anda berada di dalam area layanan, pastikan GPS aktif dan coba lagi.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Access granted state (inside service area)
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Map showing user location and service area */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-6">
          <div className="h-64">
            {locationState.latitude && locationState.longitude && (
              <MapContainer
                bounds={calculateMapBounds(locationState.latitude, locationState.longitude)}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Service area polygon */}
                <Polygon
                  positions={serviceArea}
                  pathOptions={{ 
                    fillColor: 'green', 
                    fillOpacity: 0.2, 
                    color: 'green', 
                    weight: 3 
                  }}
                >
                  <Popup>Area Layanan Bukit Kalibagor Indah</Popup>
                </Polygon>
                
                {/* Service center marker for reference */}
                <Marker 
                  position={serviceCenter}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-green-600">🏠 Pusat Area Layanan</strong><br/>
                      <small className="text-gray-600">
                        Perumahan Bukit Kalibagor Indah<br/>
                        Lat: {serviceCenter[0].toFixed(6)}<br/>
                        Lng: {serviceCenter[1].toFixed(6)}
                      </small>
                    </div>
                  </Popup>
                </Marker>
                
                {/* User location marker - GREEN (inside area) */}
                <Marker 
                  position={[locationState.latitude, locationState.longitude]}
                  icon={createUserMarkerIcon(true)}
                >
                  <Popup>
                    <div className="text-center">
                      <strong className="text-green-600">✅ Lokasi Anda</strong><br/>
                      <small className="text-gray-600">
                        Lat: {locationState.latitude.toFixed(6)}<br/>
                        Lng: {locationState.longitude.toFixed(6)}
                      </small><br/>
                      <span className="text-green-600 text-sm font-semibold">Dalam Area Layanan</span>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            )}
          </div>
          
          {/* Location info bar */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 rounded-b-xl">
            <div className="text-xs text-gray-500 mb-2 text-center">
              📍 Jarak dari pusat area layanan: ~{locationState.latitude && locationState.longitude ? 
                Math.round(getDistanceFromLatLonInKm(locationState.latitude, locationState.longitude, serviceCenter[0], serviceCenter[1]) * 1000)
              : 0}m
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <strong>Koordinat Anda:</strong>
              </div>
              <div className="text-gray-800 font-mono">
                {locationState.latitude?.toFixed(6)}, {locationState.longitude?.toFixed(6)}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <div className="text-gray-600">
                <strong>Status:</strong>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-green-600 font-semibold">Dalam Area Layanan</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Access granted message */}
        <div className="bg-white rounded-xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Lokasi Terverifikasi!</h2>
          <p className="text-gray-600 mb-6">
            Selamat! Anda berada dalam jangkauan layanan delivery Perumahan Bukit Kalibagor Indah. 
            Anda akan dialihkan ke halaman pendaftaran dalam beberapa detik...
          </p>
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <Loader className="w-5 h-5 animate-spin" />
            <span className="text-sm">Mengarahkan ke halaman pendaftaran...</span>
          </div>
        </div>
      </div>
    </div>
  );
}