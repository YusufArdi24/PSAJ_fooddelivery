import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { ArrowLeft, Home, MapPin, User, Phone } from "lucide-react";

interface FormData {
  labelAlamat: string;
  deliverAddress: string;
  catatan: string;
  namaPenerima: string;
  nomorPonsel: string;
}

interface FormErrors {
  labelAlamat?: string;
  deliverAddress?: string;
  catatan?: string;
  namaPenerima?: string;
  nomorPonsel?: string;
}

export default function ManualAddressForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    labelAlamat: "",
    deliverAddress: "",
    catatan: "",
    namaPenerima: "",
    nomorPonsel: "+62"
  });
  const [errors, setErrors] = useState<FormErrors>({});

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

  const handlePhoneChange = (value: string) => {
    // Ensure it always starts with +62
    if (!value.startsWith("+62")) {
      value = "+62";
    }
    
    // Remove any non-digit characters after +62
    const digitsOnly = value.slice(3).replace(/\D/g, "");
    const formattedPhone = "+62" + digitsOnly;
    
    handleInputChange("nomorPonsel", formattedPhone);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.labelAlamat.trim()) {
      newErrors.labelAlamat = "Label alamat wajib diisi";
    }

    if (!formData.deliverAddress.trim()) {
      newErrors.deliverAddress = "Alamat pengiriman wajib diisi";
    }

    if (!formData.namaPenerima.trim()) {
      newErrors.namaPenerima = "Nama penerima wajib diisi";
    }

    if (!formData.nomorPonsel || formData.nomorPonsel === "+62") {
      newErrors.nomorPonsel = "Nomor ponsel wajib diisi";
    } else if (formData.nomorPonsel.length < 10) {
      newErrors.nomorPonsel = "Nomor ponsel tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) {
      return;
    }

    // Simpan data alamat ke localStorage (nanti akan ke backend)
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userAddress = {
      userId: currentUser.id,
      label: formData.labelAlamat.trim(),
      address: formData.deliverAddress.trim(),
      notes: formData.catatan.trim(),
      recipientName: formData.namaPenerima.trim(),
      phoneNumber: formData.nomorPonsel,
      isDefault: true,
      createdAt: new Date().toISOString()
    };

    // Save address to user data
    currentUser.address = formData.deliverAddress.trim();
    currentUser.fullName = formData.namaPenerima.trim();
    currentUser.hasAddress = true;
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
    
    // Save detailed location data
    localStorage.setItem("userLocation", JSON.stringify(userAddress));
    
    // Clear first login flag
    localStorage.removeItem("isFirstLogin");
    
    // Redirect to dashboard
    navigate("/dashboard");
  };

  const handleBack = () => {
    navigate("/location");
  };

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
            <h1 className="text-2xl font-bold text-foreground">Tambah Alamat</h1>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleConfirm(); }} className="space-y-6">
            {/* Label Alamat */}
            <div>
              <Label htmlFor="labelAlamat" className="text-base font-medium text-foreground mb-2 block">
                Label Alamat
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Home className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  id="labelAlamat"
                  value={formData.labelAlamat}
                  onChange={(e) => handleInputChange("labelAlamat", e.target.value)}
                  placeholder="Contoh: Rumah, Kantor, dan lainnya"
                  className={`pl-12 py-3 text-base border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.labelAlamat ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.labelAlamat && (
                <p className="text-red-500 text-sm mt-1">{errors.labelAlamat}</p>
              )}
            </div>

            {/* Deliver Address */}
            <div>
              <Label htmlFor="deliverAddress" className="text-base font-medium text-foreground mb-2 block">
                Deliver Address
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-4">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <Textarea
                  id="deliverAddress"
                  value={formData.deliverAddress}
                  onChange={(e) => handleInputChange("deliverAddress", e.target.value)}
                  placeholder="Masukkan alamat lengkap untuk pengiriman"
                  rows={3}
                  className={`pl-12 py-3 text-base border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                    errors.deliverAddress ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.deliverAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.deliverAddress}</p>
              )}
            </div>

            {/* Catatan */}
            <div>
              <Label htmlFor="catatan" className="text-base font-medium text-foreground mb-2 block">
                Catatan
              </Label>
              <Textarea
                id="catatan"
                value={formData.catatan}
                onChange={(e) => handleInputChange("catatan", e.target.value)}
                placeholder="Contoh: lantai, blok, nomor rumah"
                rows={3}
                className="py-3 text-base border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Nama Penerima */}
            <div>
              <Label htmlFor="namaPenerima" className="text-base font-medium text-foreground mb-2 block">
                Nama Penerima
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  id="namaPenerima"
                  value={formData.namaPenerima}
                  onChange={(e) => handleInputChange("namaPenerima", e.target.value)}
                  placeholder="Masukkan nama penerima"
                  className={`pl-12 py-3 text-base border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.namaPenerima ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.namaPenerima && (
                <p className="text-red-500 text-sm mt-1">{errors.namaPenerima}</p>
              )}
            </div>

            {/* Nomor Ponsel */}
            <div>
              <Label htmlFor="nomorPonsel" className="text-base font-medium text-foreground mb-2 block">
                Nomor Ponsel
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                </div>
                <Input
                  id="nomorPonsel"
                  value={formData.nomorPonsel}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+62-851-3201-0024"
                  type="tel"
                  className={`pl-12 py-3 text-base border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    errors.nomorPonsel ? "border-red-500" : ""
                  }`}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Format Indonesia (+62)
              </p>
              {errors.nomorPonsel && (
                <p className="text-red-500 text-sm mt-1">{errors.nomorPonsel}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
              >
                Confirm
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}