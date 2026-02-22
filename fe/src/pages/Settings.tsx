import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Upload, Trash2, MapPin } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/ui/use-toast";
import { uploadCustomerAvatar, updateCustomerProfile, updateCustomerLocation, getAvatarUrl } from "../services/customerService";
import LeafletLocationPicker from "../components/LeafletLocationPicker";

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  labelAlamat: string;
  catatan: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  address?: string;
  labelAlamat?: string;
  catatan?: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout, isLoading, refreshUser } = useAuth();
  const [activeItem, setActiveItem] = useState("settings");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    labelAlamat: "",
    catatan: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Location states
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [hasPickedLocation, setHasPickedLocation] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);

  useEffect(() => {
    // Check authentication first
    if (isLoading) return;
    
    if (!user) {
      navigate("/signin");
      return;
    }

    // Populate form with user data
    const loadedNotes = user.address_notes || "";
    const loadedRawAddress = user.address || "";
    const loadedNotesSuffix = loadedNotes ? `, ${loadedNotes}` : "";
    const loadedCleanAddress = (loadedNotes && loadedRawAddress.endsWith(loadedNotesSuffix))
      ? loadedRawAddress.slice(0, -loadedNotesSuffix.length)
      : loadedRawAddress;
    setFormData({
      fullName: user.name || "",
      email: user.email || "",
      phoneNumber: user.phone || "",
      address: loadedCleanAddress,
      labelAlamat: user.address_label || "",
      catatan: loadedNotes,
    });

    // Load avatar if exists
    if (user.avatar) {
      const avatarUrl = getAvatarUrl(user.avatar);
      console.log('Initializing profile image from user.avatar:', user.avatar);
      console.log('Generated avatar URL:', avatarUrl);
      setProfileImage(avatarUrl);
    }

    // Load location if exists
    if (user.latitude && user.longitude) {
      setLatitude(user.latitude);
      setLongitude(user.longitude);
    }
  }, [user, isLoading, navigate]);

  const handleItemClick = (item: string) => {
    if (item === "logout") {
      handleLogout();
    } else if (item === "dashboard") {
      navigate("/dashboard");
    } else if (item === "orders") {
      navigate("/order-history");
    } else {
      setActiveItem(item);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logout berhasil",
        description: "Anda telah berhasil keluar dari akun.",
      });
      navigate("/signin");
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate anyway
      navigate("/signin");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Masukkan email yang valid";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Alamat wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
      toast({
        title: "Format file tidak valid",
        description: "Silakan pilih file JPG, JPEG, PNG, atau GIF.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (2MB = 2097152 bytes)
    if (file.size > 2097152) {
      toast({
        title: "File terlalu besar",
        description: "Ukuran file harus kurang dari 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Upload to backend
      const result = await uploadCustomerAvatar(file);
      console.log('Upload avatar result:', result);
      console.log('Avatar URL received:', result.data?.avatar_url);

      if (result.success && result.data) {
        // Set profile image with full URL
        const avatarUrl = result.data.avatar_url;
        console.log('Setting profile image to:', avatarUrl);
        setProfileImage(avatarUrl);
        
        // Refresh user data to update avatar in header (non-blocking)
        refreshUser().catch((err) => {
          console.error('Failed to refresh user after avatar upload:', err);
          // Don't fail the upload if refresh fails
        });
        
        toast({
          title: "Avatar berhasil diupload",
          description: "Foto profil Anda telah diperbarui.",
        });
      } else {
        throw new Error(result.message || "Gagal upload avatar");
      }
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Gagal upload avatar",
        description: error.message || "Terjadi kesalahan saat upload foto profil.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleDeleteImage = () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      setProfileImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      // Save general profile
      const result = await updateCustomerProfile({
        name: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber,
        address: formData.address,
      });

      if (!result.success) {
        throw new Error(result.message || "Gagal memperbarui profil");
      }

      // Also save address label & catatan if lat/lng are available
      const currentLat = latitude || user?.latitude;
      const currentLng = longitude || user?.longitude;
      if (currentLat && currentLng) {
        await updateCustomerLocation({
          latitude: currentLat,
          longitude: currentLng,
          address: formData.address,
          address_label: formData.labelAlamat || undefined,
          address_notes: formData.catatan || undefined,
        });
      }

      // Refresh AuthContext user so data persists across navigation
      try {
        await refreshUser();
      } catch (err) {
        console.warn('Failed to refresh user after save:', err);
      }

      toast({
        title: "Profil berhasil diperbarui",
        description: "Perubahan profil Anda telah disimpan.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast({
        title: "Gagal memperbarui profil",
        description: error.message || "Terjadi kesalahan saat menyimpan perubahan.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      const cancelNotes = user.address_notes || "";
      const cancelRaw = user.address || "";
      const cancelSuffix = cancelNotes ? `, ${cancelNotes}` : "";
      const cancelCleanAddress = (cancelNotes && cancelRaw.endsWith(cancelSuffix))
        ? cancelRaw.slice(0, -cancelSuffix.length)
        : cancelRaw;
      setFormData({
        fullName: user.name || "",
        email: user.email || "",
        phoneNumber: user.phone || "",
        address: cancelCleanAddress,
        labelAlamat: user.address_label || "",
        catatan: cancelNotes,
      });
      setErrors({});
      
      // Reset profile image to original
      if (user.avatar) {
        setProfileImage(getAvatarUrl(user.avatar));
      } else {
        setProfileImage(null);
      }
    }
  };

  const handleLocationSelect = (data: { latitude: number; longitude: number; address: string }) => {
    setLatitude(data.latitude);
    setLongitude(data.longitude);
    setFormData((prev) => ({
      ...prev,
      address: data.address,
    }));
    setHasPickedLocation(true);
  };

  const handleUpdateLocation = async () => {
    if (!latitude || !longitude) {
      toast({
        title: "Lokasi belum dipilih",
        description: "Silakan pilih lokasi terlebih dahulu.",
        variant: "destructive",
      });
      return;
    }

    // Validasi alamat
    if (!formData.address || !formData.address.trim()) {
      toast({
        title: "Alamat belum tersedia",
        description: "Silakan pilih lokasi pada peta untuk mendapatkan alamat.",
        variant: "destructive",
      });
      return;
    }

    // Validasi label alamat
    if (!formData.labelAlamat.trim()) {
      setErrors(prev => ({
        ...prev,
        labelAlamat: "Label alamat wajib diisi (contoh: Rumah, Kantor)",
      }));
      toast({
        title: "Label alamat diperlukan",
        description: "Silakan isi label alamat (contoh: Rumah, Kantor).",
        variant: "destructive",
      });
      return;
    }

    // Validasi catatan
    if (!formData.catatan.trim()) {
      setErrors(prev => ({
        ...prev,
        catatan: "Catatan wajib diisi (contoh: Blok A1 No. 1, Gang Bima)",
      }));
      toast({
        title: "Catatan diperlukan",
        description: "Silakan isi catatan detail alamat (contoh: Blok A1 No. 1, Gang Bima).",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingLocation(true);

    try {
      const locationData = {
        latitude,
        longitude,
        address: formData.address,
        address_label: formData.labelAlamat,
        address_notes: formData.catatan || undefined,
      };
      
      console.log('Sending location data:', locationData);
      
      const result = await updateCustomerLocation(locationData);

      if (result.success) {
        toast({
          title: "Lokasi berhasil diperbarui",
          description: "Lokasi Anda telah berhasil disimpan.",
        });
        setHasPickedLocation(false);
        // Refresh user in context so address_label & address_notes are available immediately
        try {
          await refreshUser();
        } catch (err) {
          console.warn('Failed to refresh user after location update:', err);
        }
      } else {
        throw new Error(result.message || "Gagal memperbarui lokasi");
      }
    } catch (error: any) {
      console.error("Location update error:", error);
      toast({
        title: "Gagal memperbarui lokasi",
        description: error.message || "Terjadi kesalahan saat menyimpan lokasi.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Redirect if not authenticated (handled in useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} onItemClick={handleItemClick} />
      </div>
      
      {/* Mobile Sidebar - Only visible when opened */}
      <MobileSidebar activeItem={activeItem} onItemClick={handleItemClick} isOpen={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Spacer for mobile header */}
        {/* Header */}
        <Header 
          userData={{
            username: user.name || "Guest",
            email: user.email || "guest@example.com", 
            id: user.CustomerID?.toString() || "",
            avatar: user.avatar ? getAvatarUrl(user.avatar) : undefined
          }}
          cartCount={0}
          onLogout={handleLogout}
          onMobileMenuOpen={() => setMobileMenuOpen(true)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 md:p-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
            </div>

            <div className="w-full">
              <div className="space-y-6">

                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                      <h3 className="text-lg font-semibold text-card-foreground mb-6">General Setting</h3>
                      
                      <form onSubmit={handleSave} className="space-y-8">
                        {/* Avatar Section */}
                        <div>
                          <div className="flex items-start gap-6">
                            <div className="relative">
                              {profileImage ? (
                                <>
                                  {console.log('[Settings] Rendering avatar img with src:', profileImage)}
                                  <img
                                    src={profileImage}
                                    alt="Profile"
                                    className="w-20 h-20 rounded-full object-cover border-4 border-border"
                                    onError={(e) => {
                                      console.error('[Settings] Avatar image failed to load:', profileImage);
                                      console.error('[Settings] Error event:', e);
                                    }}
                                    onLoad={() => {
                                      console.log('[Settings] Avatar image loaded successfully:', profileImage);
                                    }}
                                  />
                                </>
                              ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-4 border-border">
                                  <span className="text-white font-bold text-2xl">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png,image/gif"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  aria-label="Upload profile image"
                                  disabled={isUploadingAvatar}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploadingAvatar}
                                  className="flex items-center gap-2 border-border text-foreground hover:bg-muted"
                                >
                                  {isUploadingAvatar ? (
                                    <>
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                      Uploading...
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="w-4 h-4" />
                                      Upload Image
                                    </>
                                  )}
                                </Button>
                                {profileImage && !isUploadingAvatar && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteImage}
                                    className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                JPG, JPEG, PNG, GIF. Max 2MB
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Full Name */}
                        <div>
                          <Label htmlFor="fullName" className="text-sm font-medium text-foreground mb-3 block">
                            Full Name
                          </Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            className={`h-12 ${errors.fullName ? "border-red-500" : ""}`}
                            placeholder="Enter your full name"
                          />
                          {errors.fullName && (
                            <p className="text-red-500 text-xs mt-2">{errors.fullName}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-foreground mb-3 block">
                            Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`h-12 ${errors.email ? "border-red-500" : ""}`}
                            placeholder="Enter your email address"
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-2">{errors.email}</p>
                          )}
                        </div>

                        {/* Phone Number */}
                        <div>
                          <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground mb-3 block">
                            Nomor Telepon
                          </Label>
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="h-12"
                            placeholder="Enter your phone number"
                          />
                        </div>

                        {/* Address with Google Maps */}
                        <div className="space-y-4">
                          <Label className="text-sm font-medium text-foreground block">
                            Address
                          </Label>
                          
                          {/* Leaflet Maps Location Picker */}
                          <div className="bg-card rounded-xl p-6 border border-border">
                            <div className="flex items-center gap-2 mb-4">
                              <MapPin className="w-5 h-5 text-orange-500" />
                              <h3 className="text-base font-semibold text-foreground">Pilih Lokasi Anda</h3>
                            </div>
                            <LeafletLocationPicker
                              onLocationSelect={handleLocationSelect}
                              defaultLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                            />
                            
                            {/* Label Alamat Field */}
                            <div className="mt-4">
                              <Label htmlFor="labelAlamat" className="text-sm font-medium text-foreground mb-2 block">
                                Label Alamat *
                              </Label>
                              <Input
                                id="labelAlamat"
                                value={formData.labelAlamat}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, labelAlamat: e.target.value }));
                                  // Clear error saat user mulai mengetik
                                  if (errors.labelAlamat) {
                                    setErrors(prev => ({ ...prev, labelAlamat: undefined }));
                                  }
                                }}
                                placeholder="Contoh: Rumah, Kantor, Kos"
                                className={`h-11 border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                                  errors.labelAlamat ? "border-red-500" : ""
                                }`}
                              />
                              {errors.labelAlamat && (
                                <p className="text-red-500 text-sm mt-1">{errors.labelAlamat}</p>
                              )}
                            </div>

                            {/* Alamat Lengkap (Read only from Maps) */}
                            {formData.address && (
                              <div className="mt-4">
                                <Label className="text-sm font-medium text-foreground mb-2 block">
                                  Alamat Lengkap
                                </Label>
                                <Textarea
                                  value={formData.address}
                                  readOnly
                                  rows={2}
                                  className="text-sm border-border bg-muted text-muted-foreground resize-none"
                                />
                              </div>
                            )}

                            {/* Catatan Field (Optional) */}
                            <div className="mt-4">
                              <Label htmlFor="catatan" className="text-sm font-medium text-foreground mb-2 block">
                                Catatan *
                              </Label>
                              <Textarea
                                id="catatan"
                                value={formData.catatan}
                                onChange={(e) => {
                                  setFormData(prev => ({ ...prev, catatan: e.target.value }));
                                  if (errors.catatan) setErrors(prev => ({ ...prev, catatan: undefined }));
                                }}
                                placeholder="Contoh: Blok A1 No. 1, Gang Bima"
                                rows={2}
                                className={`text-sm border-border bg-card focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none ${
                                  errors.catatan ? "border-red-500" : ""
                                }`}
                              />
                              {errors.catatan && (
                                <p className="text-red-500 text-sm mt-1">{errors.catatan}</p>
                              )}
                            </div>
                            
                            {/* Update Location Button */}
                            {hasPickedLocation && (
                              <Button
                                type="button"
                                onClick={handleUpdateLocation}
                                disabled={isUpdatingLocation || !formData.labelAlamat.trim() || !formData.address || !formData.catatan.trim()}
                                className="w-full mt-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium"
                              >
                                {isUpdatingLocation ? (
                                  <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Menyimpan Lokasi...
                                  </div>
                                ) : (
                                  "Simpan Lokasi"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="px-8 h-12 font-medium"
                            disabled={isSaving}
                          >
                            Batalkan
                          </Button>
                          <Button
                            type="submit"
                            className="px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Menyimpan...
                              </>
                            ) : (
                              "Simpan Perubahan"
                            )}
                          </Button>
                        </div>
                      </form>
                    </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
