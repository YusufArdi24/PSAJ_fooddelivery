import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, MapPin } from "lucide-react";
import LeafletLocationPicker from "../components/LeafletLocationPicker";
import { updateCustomerLocation } from "../services/customerService";
import { completeRegistration } from "../services/authService";
import { toast } from "../components/ui/use-toast";
import { useAuth } from "../contexts/AuthContext";

interface FormData {
  labelAlamat: string;
  deliverAddress: string;
  catatan: string;
  latitude?: number;
  longitude?: number;
}

interface FormErrors {
  labelAlamat?: string;
  deliverAddress?: string;
  location?: string;
  catatan?: string;
  latitude?: string;
  longitude?: string;
}

export default function ManualAddressForm() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    labelAlamat: "",
    deliverAddress: "",
    catatan: "",
    latitude: undefined,
    longitude: undefined,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    setFormData(prev => ({
      ...prev,
      latitude: location.latitude,
      longitude: location.longitude,
      deliverAddress: location.address,
    }));
    
    // Clear location error
    if (errors.location) {
      setErrors(prev => ({
        ...prev,
        location: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.labelAlamat.trim()) {
      newErrors.labelAlamat = "Label alamat wajib diisi (contoh: Rumah, Kantor)";
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = "Silakan pilih lokasi pada peta";
    }

    if (!formData.deliverAddress.trim()) {
      newErrors.deliverAddress = "Alamat pengiriman wajib diisi";
    }

    if (!formData.catatan.trim()) {
      newErrors.catatan = "Catatan wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const pendingToken = localStorage.getItem('wdn_pt');
    const pendingPhone = localStorage.getItem('wdn_phone') || '';

    try {
      if (pendingToken) {
        // ── Pending registration flow: create account now ────────────────
        const result = await completeRegistration({
          pending_token: pendingToken,
          phone:         pendingPhone,
          address:       formData.deliverAddress.trim(),
          address_label: formData.labelAlamat.trim(),
          address_notes: formData.catatan.trim(),
          latitude:      formData.latitude!,
          longitude:     formData.longitude!,
        });

        if (result.success) {
          // completeRegistration already stored token + user in localStorage
          try { await refreshUser(); } catch (_) {}
          // Clear pending flow keys
          localStorage.removeItem('wdn_pt');
          localStorage.removeItem('wdn_phone');
          localStorage.removeItem('wdn_email');
          localStorage.removeItem('isFirstLogin');

          toast({
            title: 'Akun berhasil dibuat! 🎉',
            description: 'Selamat datang di Warung Edin.',
          });
          navigate('/dashboard');
        } else {
          throw new Error(result.message || 'Gagal membuat akun');
        }
      } else {
        // ── Normal authenticated flow ────────────────────────────────────
        const result = await updateCustomerLocation({
          latitude:      formData.latitude!,
          longitude:     formData.longitude!,
          address:       formData.deliverAddress.trim(),
          address_label: formData.labelAlamat.trim(),
          address_notes: formData.catatan.trim(),
        });

        if (result.success) {
          try { await refreshUser(); } catch (err) {
            console.warn('Failed to refresh user after location save:', err);
          }
          toast({
            title: 'Lokasi berhasil disimpan',
            description: 'Alamat Anda telah diperbarui.',
          });
          localStorage.removeItem('isFirstLogin');
          navigate('/dashboard');
        } else {
          throw new Error(result.message || 'Gagal menyimpan lokasi');
        }
      }
    } catch (error: any) {
      console.error('Location/registration error:', error);
      toast({
        title: pendingToken ? 'Gagal membuat akun' : 'Gagal menyimpan lokasi',
        description: error.message || 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/location");
  };

  return (
    <div className="min-h-screen bg-background lg:h-screen lg:overflow-hidden lg:flex lg:flex-col">
      <div className="container mx-auto px-4 py-6 w-full lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden">
        <div className="max-w-2xl mx-auto lg:max-w-6xl w-full lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden">
          {/* Header - mobile only */}
          <div className="lg:hidden flex items-center gap-4 mb-4 flex-shrink-0">
            <Button
              onClick={handleBack}
              variant="ghost"
              size="sm"
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Set Lokasi</h1>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between mb-4 flex-shrink-0">
            <h1 className="text-2xl font-bold text-foreground">Set Lokasi</h1>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="flex flex-col gap-4 lg:flex-1 lg:overflow-hidden lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left: Map Picker */}
            <div className="bg-card rounded-xl p-6 border border-border flex flex-col gap-4 lg:overflow-hidden">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                Pilih Lokasi di Peta
              </h2>
              <LeafletLocationPicker onLocationSelect={handleLocationSelect} />
              {errors.location && (
                <p className="text-red-500 text-sm">{errors.location}</p>
              )}
            </div>

            {/* Right: Form Fields */}
            <div className="bg-card rounded-xl p-6 border border-border flex flex-col gap-5 lg:overflow-y-auto">
              <h2 className="text-lg font-semibold text-foreground">Detail Alamat</h2>

              {/* Label Alamat */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="labelAlamat" className="text-sm font-medium text-foreground">
                  Label Alamat <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="labelAlamat"
                  value={formData.labelAlamat}
                  onChange={(e) => handleInputChange("labelAlamat", e.target.value)}
                  placeholder="Contoh: Rumah, Kantor, Kos"
                  className={`text-sm border-border bg-background focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.labelAlamat ? "border-red-500" : ""
                  }`}
                />
                {errors.labelAlamat && (
                  <p className="text-red-500 text-xs">{errors.labelAlamat}</p>
                )}
              </div>

              {/* Alamat Lengkap (read-only, from map) */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Alamat Lengkap
                </Label>
                <Textarea
                  value={formData.deliverAddress}
                  readOnly
                  rows={2}
                  placeholder="Otomatis terisi setelah memilih lokasi di peta..."
                  className="text-sm border-border bg-muted text-muted-foreground resize-none"
                />
              </div>

              {/* Catatan */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="catatan" className="text-sm font-medium text-foreground">
                  Catatan <span className="text-orange-500">*</span>
                </Label>
                <Textarea
                  id="catatan"
                  value={formData.catatan}
                  onChange={(e) => handleInputChange("catatan", e.target.value)}
                  placeholder="Contoh: Blok A1 No. 1, Gang Bima"
                  rows={3}
                  className={`text-sm border-border bg-background focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                    errors.catatan ? "border-red-500" : ""
                  }`}
                />
                {errors.catatan && (
                  <p className="text-red-500 text-xs">{errors.catatan}</p>
                )}
              </div>

              {/* Spacer to push button down */}
              <div className="flex-1" />

              {/* Simpan Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 hover:shadow-md"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}