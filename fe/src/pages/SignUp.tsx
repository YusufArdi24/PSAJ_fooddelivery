import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, ChefHat, UtensilsCrossed, Coffee, Croissant } from "lucide-react";
import Logo from "../assets/warungedin.png";
import { toast } from "../components/ui/use-toast";
import { preRegisterCustomer } from "../services/authService";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    } else if (formData.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Konfirmasi password wajib diisi";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Password tidak cocok";
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

    setIsLoading(true);

    try {
      const result = await preRegisterCustomer({
        name: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });

      if (result.success) {
        // Store pending token so VerifyEmail page knows to show OTP mode
        localStorage.setItem('wdn_pt', result.pending_token);
        localStorage.setItem('wdn_email', formData.email);

        toast({
          title: "Kode Verifikasi Terkirim",
          description: "Masukkan kode OTP yang kami kirimkan ke email Anda.",
        });

        navigate("/verify-email", { state: { email: formData.email } });
      } else {
        throw new Error(result.message || "Registrasi gagal");
      }
    } catch (error: any) {
      console.error("Sign up error:", error);

      const errorMessage = error.message || "Registrasi gagal. Silakan coba lagi.";

      // Handle validation errors from backend
      if (error.validationErrors) {
        const backendErrors: FormErrors = {};
        
        // Map backend errors to form errors
        Object.keys(error.validationErrors).forEach((field) => {
          const messages = error.validationErrors[field];
          if (Array.isArray(messages) && messages.length > 0) {
            // Map backend field names to frontend field names
            if (field === 'name') {
              backendErrors.username = messages[0];
            } else {
              (backendErrors as any)[field] = messages[0];
            }
          }
        });
        
        setErrors(backendErrors);
        
        // Show first error in toast
        const firstError = Object.values(error.validationErrors)[0];
        const firstErrorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
        
        toast({
          title: "Validasi Gagal",
          description: firstErrorMessage || errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registrasi Gagal",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fafafa] flex">
      {/* Left Side - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:justify-start lg:pl-16 xl:pl-20">
        <div className="w-full max-w-md">
          {/* Form Container */}
          <div className="bg-white rounded-xl shadow-sm pb-4 px-4 sm:pb-5 sm:px-5 border border-gray-100">
            {/* Logo */}
            <div className="text-center">
              <img 
                src={Logo} 
                alt="Edin Delivery Logo" 
                className="h-20 w-auto mx-auto mt-5 mb-2"
              />
            </div>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Buat Akun Anda
              </h1>
              <p className="text-gray-600 text-xs mb-3">
                Buat akun Warung Edin Anda untuk memesan makanan lebih cepat.
              </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-2">
              {/* Username Field */}
              <div>
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 mb-1 block"
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
                  className="text-sm font-medium text-gray-700 mb-1 block"
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

              {/* Phone Field removed - collected on /complete-profile */}

              {/* Password Field */}
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 mb-1 block"
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

              {/* Confirm Password Field */}
              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700 mb-1 block"
                >
                  Konfirmasi Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Masukkan ulang password Anda"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pr-10 ${
                      errors.confirmPassword
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-200"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Mendaftar...
                  </div>
                ) : (
                  "Daftar"
                )}
              </Button>


            </form>

            {/* Sign In Link */}
            <p className="text-center text-gray-600 text-xs mt-4">
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
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-yellow-50/50"></div>
        
        {/* Floating Icons with Animation */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Chef Hat - Main Element */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-bounce-slow">
              <ChefHat size={100} className="text-orange-500" strokeWidth={1.5} />
            </div>
          </div>

          {/* Floating Utensils */}
          <div className="absolute top-1/4 left-1/3 animate-float-1">
            <UtensilsCrossed size={40} className="text-orange-600/70" strokeWidth={1.5} />
          </div>
          
          <div className="absolute top-2/3 left-2/3 animate-float-2">
            <UtensilsCrossed size={32} className="text-orange-500/60" strokeWidth={1.5} />
          </div>

          {/* Floating Food Items */}
          <div className="absolute top-1/2 right-1/3 animate-float-3">
            <Coffee size={44} className="text-amber-600/70" strokeWidth={1.5} />
          </div>
          
          <div className="absolute bottom-1/3 left-1/4 animate-float-1 delay-1000">
            <Croissant size={36} className="text-yellow-600/70" strokeWidth={1.5} />
          </div>

          {/* Decorative Circles */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 border-4 border-orange-200/30 rounded-full animate-pulse-slow"></div>
          </div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-80 h-80 border-2 border-orange-100/20 rounded-full animate-pulse-slow delay-[1000ms]"></div>
          </div>

          {/* Subtle Background Shapes */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-yellow-200/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full animate-pulse-slow delay-[2000ms]"></div>
          
          {/* Small Accent Circles */}
          <div className="absolute top-1/5 right-1/4 w-3 h-3 bg-orange-400/40 rounded-full animate-float-1"></div>
          <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-yellow-400/40 rounded-full animate-float-2"></div>
          <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-orange-300/40 rounded-full animate-float-3"></div>
        </div>

        {/* Bottom Text */}
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center max-w-md px-4">
          <h3 className="text-2xl font-bold text-orange-700 mb-3">
            Nikmati Cita Rasa Terbaik
          </h3>
          <p className="text-gray-600 text-sm">
            Dapatkan makanan lezat dari warung favorit Anda, diantar langsung ke rumah dengan cepat dan aman
          </p>
        </div>
      </div>


    </div>
  );
}
