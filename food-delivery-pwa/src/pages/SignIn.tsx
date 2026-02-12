import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Logo from "../assets/Logo_edindelivery_.png";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if user exists in localStorage (simple simulation)
    const existingUsers = JSON.parse(localStorage.getItem("allUsers") || "[]");
    const user = existingUsers.find((u: any) => 
      u.email === formData.email && u.password === formData.password
    );

    if (user) {
      // Set current user dan langsung ke dashboard
      // Untuk Sign In, asumsi user sudah pernah setup location
      localStorage.setItem("currentUser", JSON.stringify(user));
      navigate("/dashboard");
    } else {
      setErrors({ email: "Email atau password salah" });
    }
  };

  const handleSocialLogin = (provider: string) => {
    // Simulate social login
    const userData = {
      id: Date.now().toString(),
      username: provider === "google" ? "Pengguna Google" : "Pengguna Apple",
      email: `user@${provider}.com`,
      fullName: "",
      address: "",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("currentUser", JSON.stringify(userData));
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src={Logo} 
              alt="Edin Delivery" 
              className="w-24 h-24 mx-auto mb-6 object-contain"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Selamat Datang!
            </h1>
            <p className="text-gray-500 text-sm">
              Selamat datang di Edin Delivery, masuk dengan email atau
              hubungkan akun Google untuk memulai
            </p>
          </div>

          <form onSubmit={handleSignIn} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Masukkan email Anda"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                  errors.email ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Masukkan password Anda"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.password ? "border-red-300" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">ATAU</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {/* Google */}
              <Button
                type="button"
                onClick={() => handleSocialLogin("google")}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Lanjutkan dengan Google
              </Button>

              {/* Apple */}
              <Button
                type="button"
                onClick={() => handleSocialLogin("apple")}
                className="w-full py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Lanjutkan dengan Apple
              </Button>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-lg"
            >
              Masuk
            </Button>

            {/* Footer Links */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-sm">
              <Link
                to="/signup"
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                Belum punya akun? <span className="font-medium">Daftar</span>
              </Link>
              <button
                type="button"
                className="text-gray-600 hover:text-orange-500 transition-colors"
              >
                Lupa Password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}