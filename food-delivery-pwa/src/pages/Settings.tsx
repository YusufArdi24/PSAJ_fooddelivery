import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Upload, Trash2 } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import MobileSidebar from "../components/MobileSidebar";

interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  address: string;
  createdAt: string;
}

interface FormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  address?: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("settings");
  const [activeSettingTab, setActiveSettingTab] = useState("general");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    phoneNumber: "+62-851-3201-0024",
    address: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaved, setIsSaved] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) {
      navigate("/signup");
      return;
    }

    const user = JSON.parse(currentUser) as UserData;
    setUserData(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      phoneNumber: "+62-851-3201-0024",
      address: user.address,
    });
  }, [navigate]);

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

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isFirstLogin");
    localStorage.removeItem("hasSeenOnboarding");
    navigate("/signup");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      alert('Please select a JPG, JPEG, or PNG file.');
      return;
    }

    // Check file size (1MB = 1048576 bytes)
    if (file.size > 1048576) {
      alert('File size must be less than 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setProfileImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteImage = () => {
    if (window.confirm('Are you sure you want to delete your profile picture?')) {
      setProfileImage(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Update user data
    if (userData) {
      const updatedUser = {
        ...userData,
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setUserData(updatedUser);
      setIsSaved(true);

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    }
  };

  const handleCancel = () => {
    if (userData) {
      setFormData({
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: "+62-851-3201-0024",
        address: userData.address,
      });
      setErrors({});
      setProfileImage(null);
    }
  };

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - Hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar activeItem={activeItem} onItemClick={handleItemClick} />
      </div>
      
      {/* Mobile Sidebar - Only visible when opened */}
      <MobileSidebar activeItem={activeItem} onItemClick={handleItemClick} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Spacer for mobile header */}
        <div className="lg:hidden h-14" />
        
        {/* Header */}
        <Header 
          userData={{
            username: userData?.username || "Guest",
            email: userData?.email || "guest@example.com", 
            id: userData?.id || ""
          }}
          cartCount={0}
          onLogout={handleLogout}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-background">
          <div className="p-4 md:p-6">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Settings Sidebar */}
              <div className="w-full lg:w-80 space-y-2">
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <button
                    onClick={() => setActiveSettingTab("general")}
                    className={`w-full p-4 text-left flex items-center gap-3 transition-all duration-200 ${
                      activeSettingTab === "general"
                        ? "bg-primary/10 text-primary font-medium border-r-4 border-primary"
                        : "text-card-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-sm">General</span>
                  </button>
                  <button
                    onClick={() => setActiveSettingTab("security")}
                    className={`w-full p-4 text-left flex items-center gap-3 transition-all duration-200 border-t border-border ${
                      activeSettingTab === "security"
                        ? "bg-primary/10 text-primary font-medium border-r-4 border-primary"
                        : "text-card-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="text-sm">Security Options</span>
                  </button>
                </div>
              </div>

              {/* Main Settings Content */}
              <div className="flex-1 max-w-4xl">
                {activeSettingTab === "general" && (
                  <div className="space-y-6">
                    {/* Success Message */}
                    {isSaved && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <p className="text-green-800 dark:text-green-200 font-medium">Profile berhasil diperbarui!</p>
                      </div>
                    )}

                    <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                      <h3 className="text-lg font-semibold text-card-foreground mb-6">General Setting</h3>
                      
                      <form onSubmit={handleSave} className="space-y-8">
                        {/* Avatar Section */}
                        <div>
                          <div className="flex items-start gap-6">
                            <div className="relative">
                              {profileImage ? (
                                <img
                                  src={profileImage}
                                  alt="Profile"
                                  className="w-20 h-20 rounded-full object-cover border-4 border-border"
                                />
                              ) : (
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-4 border-border">
                                  <span className="text-white font-bold text-2xl">
                                    {userData?.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/jpeg,image/jpg,image/png"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                  aria-label="Upload profile image"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="flex items-center gap-2 border-border text-foreground hover:bg-muted"
                                >
                                  <Upload className="w-4 h-4" />
                                  Upload Image
                                </Button>
                                {profileImage && (
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
                                JPG, JPEG, PNG. Max 1MB
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

                        {/* Shipping Address */}
                        <div>
                          <Label htmlFor="address" className="text-sm font-medium text-foreground mb-3 block">
                            Shipping Address
                          </Label>
                          <textarea
                            id="address"
                            name="address"
                            rows={4}
                            placeholder="Enter your shipping address"
                            value={formData.address}
                            onChange={handleChange}
                            className={`w-full p-4 text-foreground bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring placeholder:text-muted-foreground resize-none ${
                              errors.address ? "border-red-500" : ""
                            }`}
                          />
                          {errors.address && (
                            <p className="text-red-500 text-xs mt-2">{errors.address}</p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className="px-8 h-12 font-medium"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="px-8 h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {activeSettingTab === "security" && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <h3 className="text-lg font-semibold text-card-foreground mb-4">Security Options</h3>
                    <p className="text-muted-foreground">Security settings akan tersedia dalam pembaruan mendatang.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
