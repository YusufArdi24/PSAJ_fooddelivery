import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeOff, ChefHat, CheckCircle } from "lucide-react";
import { toast } from "../components/ui/use-toast";
import { resetPassword } from "../services/authService";
import Logo from "../assets/warungedin.png";

interface FormErrors {
  password?: string;
  password_confirmation?: string;
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    if (!token || !email) {
      toast({
        title: "Link Tidak Valid",
        description: "Link reset password tidak valid atau sudah kadaluarsa.",
        variant: "destructive",
      });
      navigate("/forgot-password");
    }
  }, [token, email, navigate]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!password) {
      newErrors.password = "Password baru wajib diisi";
    } else if (password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }
    if (!passwordConfirmation) {
      newErrors.password_confirmation = "Konfirmasi password wajib diisi";
    } else if (password !== passwordConfirmation) {
      newErrors.password_confirmation = "Konfirmasi password tidak cocok";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Password Berhasil Diubah",
          description: "Silakan login dengan password baru Anda.",
        });
      } else {
        throw new Error(result.message || "Gagal mereset password");
      }
    } catch (err: any) {
      const msg = err.message || "Terjadi kesalahan. Silakan coba lagi.";
      toast({
        title: "Reset Password Gagal",
        description: msg,
        variant: "destructive",
      });
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("kadaluarsa")) {
        setErrors({ password: "Link reset password sudah kadaluarsa. Silakan minta link baru." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fafafa] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:justify-start lg:pl-16 xl:pl-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm pb-6 px-6 sm:pb-8 sm:px-8 border border-gray-100">
            {/* Logo */}
            <div className="text-center">
              <img
                src={Logo}
                alt="Warung Edin"
                className="h-30 w-36 mx-auto mt-8 mb-4"
              />
            </div>

            {!isSuccess ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">
                    Buat Password Baru
                  </h1>
                  <p className="text-gray-500 text-xs">
                    Masukkan password baru untuk akun{" "}
                    <span className="font-medium text-gray-700">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <Label
                      htmlFor="password"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Password Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                        }}
                        placeholder="Minimal 8 karakter"
                        className={`w-full pr-10 ${
                          errors.password ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <Label
                      htmlFor="password_confirmation"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Konfirmasi Password Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="password_confirmation"
                        type={showPasswordConfirmation ? "text" : "password"}
                        value={passwordConfirmation}
                        onChange={(e) => {
                          setPasswordConfirmation(e.target.value);
                          if (errors.password_confirmation)
                            setErrors((p) => ({ ...p, password_confirmation: undefined }));
                        }}
                        placeholder="Ulangi password baru"
                        className={`w-full pr-10 ${
                          errors.password_confirmation ? "border-red-500" : "border-gray-200"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswordConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password_confirmation && (
                      <p className="text-red-500 text-xs mt-1">{errors.password_confirmation}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Menyimpan...
                      </div>
                    ) : (
                      "Simpan Password Baru"
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-500">
                    Ingat password?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/signin")}
                      className="text-orange-600 hover:text-orange-700 font-medium"
                    >
                      Login di sini
                    </button>
                  </p>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Password Berhasil Diubah!
                </h2>
                <p className="text-gray-500 text-sm mb-6">
                  Password Anda telah berhasil diperbarui. Silakan login dengan password baru.
                </p>
                <Button
                  onClick={() => navigate("/signin")}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Login Sekarang
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-yellow-50/50"></div>
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-bounce-slow">
              <ChefHat size={100} className="text-orange-500" strokeWidth={1.5} />
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-64 h-64 border-4 border-orange-200/30 rounded-full animate-pulse-slow"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-80 h-80 border-2 border-orange-100/20 rounded-full animate-pulse-slow delay-[1000ms]"></div>
          </div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-yellow-200/20 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full"></div>
        </div>
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center max-w-md px-4">
          <h3 className="text-2xl font-bold text-orange-700 mb-3">
            Keamanan Akun Anda
          </h3>
          <p className="text-gray-600 text-sm">
            Buat password yang kuat untuk menjaga keamanan akun dan data pribadi Anda.
          </p>
        </div>
      </div>
    </div>
  );
}
