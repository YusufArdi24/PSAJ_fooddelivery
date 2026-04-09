import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, ChefHat, UtensilsCrossed, Coffee, Croissant } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/ui/use-toast";
import Logo from "/warungedin.png";
import { useGoogleLogin } from "@react-oauth/google";
import { googleAuthCustomer } from "../services/authService";

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
  const [searchParams] = useSearchParams();
  const { login, isLoading, refreshUser } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Show a notification when the user was auto-logged-out due to a new session
  // on another device.
  useEffect(() => {
    if (searchParams.get('reason') === 'session_expired') {
      toast({
        title: 'Sesi Berakhir',
        description: 'Akun Anda masuk dari perangkat lain. Silakan login kembali.',
        variant: 'destructive',
      });
    }
  }, [searchParams]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsGoogleLoading(true);
      try {
        // For auth-code flow, tokenResponse contains code, not access_token
        // We need to exchange it for tokens on backend
        const result = await googleAuthCustomer(tokenResponse.access_token);

        if (!result.success) throw new Error(result.message || 'Login Google gagal');

        if (result.is_login) {
          // Existing verified customer — credentials already stored by googleAuthCustomer
          await refreshUser();
          const customer = result.data?.customer;
          toast({ title: 'Login Google Berhasil', description: 'Selamat datang!' });
          if (!customer?.phone) {
            navigate('/complete-profile');
          } else if (!customer?.address) {
            navigate('/location');
          } else {
            navigate('/dashboard');
          }
        } else {
          // New / unverified customer → pending registration flow
          localStorage.setItem('wdn_pt', result.pending_token);
          localStorage.setItem('wdn_email', result.email ?? '');

          toast({ title: 'Verifikasi Email', description: 'Masukkan kode OTP yang kami kirimkan.' });
          navigate('/verify-email', { state: { email: result.email } });
        }
      } catch (err: any) {
        toast({ title: 'Login Google Gagal', description: err.message || 'Terjadi kesalahan', variant: 'destructive' });
      } finally {
        setIsGoogleLoading(false);
      }
    },
    onError: () => {
      toast({ title: 'Login Google Gagal', description: 'Popup Google ditutup atau terjadi kesalahan', variant: 'destructive' });
    },
    flow: 'auth-code',
  });

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

    try {
      console.log('Starting login process...');
      
      const result = await login({
        email: formData.email,
        password: formData.password,
      });
      
      console.log('Login result:', result);
      
      if (result.success) {
        // Smart redirect based on verification + profile completeness
        const customer = result.data?.customer;

        if (!customer?.is_verified) {
          toast({ title: "Login Berhasil", description: "Silakan verifikasi email Anda terlebih dahulu." });
          navigate("/verify-email", { state: { email: customer?.email } });
        } else if (!customer?.phone) {
          toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
          navigate("/complete-profile");
        } else if (!customer?.address) {
          toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
          navigate("/location");
        } else {
          toast({ title: "Login Berhasil", description: "Selamat datang kembali!" });
          navigate("/dashboard");
        }
      } else {
        throw new Error(result.message || 'Login gagal');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      const errorMessage = error.message || 'Login gagal. Silakan coba lagi.';
      
      toast({
        title: "Login Gagal",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Set form errors
      if (errorMessage.includes('email') || errorMessage.includes('password')) {
        setErrors({ 
          email: "Email atau password salah",
          password: "Email atau password salah" 
        });
      } else {
        setErrors({ email: errorMessage });
      }
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fafafa] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:justify-start lg:pl-16 xl:pl-20">
        <div className="w-full max-w-md">
          {/* Form Container */}
          <div className="bg-white rounded-xl shadow-sm pb-4 px-4 sm:pb-5 sm:px-5 border border-gray-100">
            {/* Logo */}
            <div className="text-center -mt-2">
              <img 
                src={Logo} 
                alt="Warung Edin" 
                className="h-30 w-40 mx-auto mt-10 mb-5"
              />
            </div>
            
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Selamat Datang!
              </h1>
              <p className="text-gray-600 text-xs mb-3">
                Selamat datang di Warung Edin, masuk dengan email atau
                hubungkan akun Google untuk memulai
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
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
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Masukkan email Anda"
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
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Masukkan password Anda"
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

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Memproses...
                  </div>
                ) : (
                  "Masuk"
                )}
              </Button>

              {/* Divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">atau</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3">
                {/* Google */}
                <Button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={isGoogleLoading || !import.meta.env.VITE_GOOGLE_CLIENT_ID}
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                >
                  {isGoogleLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {isGoogleLoading ? 'Memproses...' : 'Lanjutkan dengan Google'}
                </Button>
              </div>
            </form>

            {/* Sign Up Link */}
            <p className="text-center text-gray-600 text-xs mt-4">
              Belum punya akun?{" "}
              <button
                onClick={() => navigate("/signup")}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                Daftar
              </button>
            </p>

            {/* Forgot Password */}
            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Lupa Password?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Visual Effects (Same as SignUp) */}
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