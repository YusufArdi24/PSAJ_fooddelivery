import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, MapPin, Package, Truck } from "lucide-react";
import Logo from "../assets/Logo_edindelivery_.png";

interface FormData {
  username: string;
  email: string;
  password: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
}

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Nama pengguna wajib diisi";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Masukkan email yang valid";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Create user data
    const userData = {
      id: Date.now().toString(),
      username: formData.username,
      email: formData.email,
      password: formData.password,
      fullName: "",
      address: "",
      createdAt: new Date().toISOString(),
    };

    // Save to allUsers array for signin later
    const existingUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
    existingUsers.push(userData);
    localStorage.setItem("allUsers", JSON.stringify(existingUsers));

    // Set current user and redirect to location page for onboarding
    localStorage.setItem("currentUser", JSON.stringify(userData));
    localStorage.setItem("isFirstLogin", "true");

    // Redirect to location page for new users
    navigate("/location");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex">
      {/* Left Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:justify-start lg:pl-16 xl:pl-20">
        <div className="w-full max-w-md">
          {/* Form Container */}
          <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
            {/* Logo */}
            <div className="text-center mb-6">
              <img 
                src={Logo} 
                alt="Edin Delivery Logo" 
                className="h-16 w-auto mx-auto mb-4"
              />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Buat Akun Anda
            </h1>
            <p className="text-gray-600 text-sm mb-6">
              Buat akun Edin Delivery Anda untuk memesan makanan lebih cepat dan
              melacak pesanan Anda.
            </p>

            <form onSubmit={handleSignUp} className="space-y-4">
              {/* Username Field */}
              <div>
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Nama Pengguna
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Masukkan nama pengguna"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full ${
                    errors.username
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200"
                  }`}
                />
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Masukkan email Anda"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full ${
                    errors.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200"
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password Anda"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pr-10 ${
                      errors.password
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg mt-6"
              >
                Daftar
              </Button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-gray-600 text-sm mt-6">
              Sudah punya akun?{" "}
              <button
                onClick={() => navigate("/signin")}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Masuk
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Visual Effects */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden bg-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-white"></div>
        
        {/* Floating Icons with Animation */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Delivery Truck - Main Element */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-bounce-slow">
              <Truck size={80} className="text-orange-500/80" />
            </div>
          </div>

          {/* Floating Map Pins */}
          <div className="absolute top-1/4 left-1/3 animate-float-1">
            <MapPin size={32} className="text-red-500/70" />
          </div>
          
          <div className="absolute top-2/3 left-2/3 animate-float-2">
            <MapPin size={24} className="text-red-400/60" />
          </div>

          {/* Floating Packages */}
          <div className="absolute top-1/2 right-1/3 animate-float-3">
            <Package size={36} className="text-orange-600/70" />
          </div>
          
          <div className="absolute bottom-1/3 left-1/4 animate-float-1 delay-1000">
            <Package size={28} className="text-orange-500/60" />
          </div>

          {/* Delivery Route Lines */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <svg width="200" height="200" className="animate-pulse-slow">
              <path
                d="M20,100 Q60,50 100,100 T180,100"
                stroke="rgba(251, 146, 60, 0.4)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="5,5"
                className="animate-dash"
              />
            </svg>
          </div>

          {/* Subtle Background Shapes */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-100/30 to-yellow-100/30 rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-yellow-100/30 to-orange-100/30 rounded-full animate-pulse-slow delay-[2000ms]"></div>
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center">
          <h3 className="text-xl font-semibold text-orange-700 mb-2">
            Fast & Reliable Delivery
          </h3>
          <p className="text-gray-600 text-sm max-w-xs">
            Get your favorite food delivered quickly and safely to your doorstep
          </p>
        </div>
      </div>


    </div>
  );
}
