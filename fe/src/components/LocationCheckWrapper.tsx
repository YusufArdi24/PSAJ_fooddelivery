import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader } from "lucide-react";

interface LocationCheckWrapperProps {
  children: React.ReactNode;
  requiresLocationCheck?: boolean;
}

// Service area polygon untuk Bukit Kalibagor Indah
const serviceArea = [
  [-7.4835, 109.2915], // Barat Laut
  [-7.4835, 109.2975], // Timur Laut  
  [-7.4885, 109.2975], // Timur Selatan
  [-7.4885, 109.2915], // Barat Selatan
] as [number, number][];

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

export default function LocationCheckWrapper({ 
  children, 
  requiresLocationCheck = true 
}: LocationCheckWrapperProps) {
  const navigate = useNavigate();
  const [isCheckingLocation, setIsCheckingLocation] = useState(false);
  const [hasValidatedLocation, setHasValidatedLocation] = useState(false);

  useEffect(() => {
    if (!requiresLocationCheck) {
      setHasValidatedLocation(true);
      return;
    }

    // Check if we already validated location in current session
    const locationValidated = sessionStorage.getItem('locationValidated');
    const lastValidation = sessionStorage.getItem('lastLocationCheck');
    const now = new Date().getTime();
    
    // Re-check location every 30 minutes
    if (locationValidated && lastValidation && (now - parseInt(lastValidation) < 30 * 60 * 1000)) {
      setHasValidatedLocation(true);
      return;
    }

    // Validate current location
    validateCurrentLocation();
  }, [requiresLocationCheck]);

  const validateCurrentLocation = () => {
    setIsCheckingLocation(true);

    if (!navigator.geolocation) {
      // If geolocation is not supported, redirect to geo-fencing page for manual handling
      navigate('/geo-fencing');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userPoint: [number, number] = [latitude, longitude];
        const isWithinArea = isPointInPolygon(userPoint, serviceArea);
        
        if (isWithinArea) {
          // User is within service area, allow access
          sessionStorage.setItem('locationValidated', 'true');
          sessionStorage.setItem('lastLocationCheck', new Date().getTime().toString());
          setHasValidatedLocation(true);
          setIsCheckingLocation(false);
        } else {
          // User is outside service area, redirect to geo-fencing page
          navigate('/geo-fencing');
        }
      },
      (error) => {
        // If there's an error getting location, redirect to geo-fencing page for proper handling
        console.error('Location error:', error);
        navigate('/geo-fencing');
      },
      {
        enableHighAccuracy: false, // Use less accurate but faster location for validation
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  };

  // Show loading while checking location
  if (requiresLocationCheck && (isCheckingLocation || !hasValidatedLocation)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Loader className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verifikasi Lokasi</h2>
            <p className="text-gray-600">Memverifikasi lokasi Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  // If location is validated or not required, show the protected content
  return <>{children}</>;
}