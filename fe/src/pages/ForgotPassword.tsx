import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ChefHat, ArrowLeft, Mail } from "lucide-react";
import { toast } from "../components/ui/use-toast";
import { forgotPassword } from "../services/authService";
import Logo from "../assets/warungedin.png";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setEmailError("Email wajib diisi");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Masukkan email yang valid");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setIsSent(true);
        toast({
          title: "Email Terkirim",
          description: "Link reset password telah dikirim ke email Anda.",
        });
      } else {
        throw new Error(result.message || "Gagal mengirim email");
      }
    } catch (err: any) {
      toast({
        title: "Gagal",
        description: err.message || "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fafafa] flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:justify-start lg:pl-16 xl:pl-20">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => navigate("/signin")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm"
          >
            <ArrowLeft size={16} />
            Kembali ke Login
          </button>

          <div className="bg-white rounded-xl shadow-sm pb-6 px-6 sm:pb-8 sm:px-8 border border-gray-100">
            {/* Logo */}
            <div className="text-center">
              <img
                src={Logo}
                alt="Warung Edin"
                className="h-30 w-36 mx-auto mt-8 mb-4"
              />
            </div>

            {!isSent ? (
              <>
                <div className="text-center mb-6">
                  <h1 className="text-xl font-bold text-gray-900 mb-1">
                    Lupa Password?
                  </h1>
                  <p className="text-gray-500 text-xs">
                    Masukkan email akun Anda dan kami akan mengirimkan link untuk
                    mereset password.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label
                      htmlFor="email"
                      className="text-sm font-medium text-gray-700 mb-2 block"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      placeholder="Masukkan email Anda"
                      className={`w-full ${
                        emailError ? "border-red-500" : "border-gray-200"
                      }`}
                    />
                    {emailError && (
                      <p className="text-red-500 text-xs mt-1">{emailError}</p>
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
                        Mengirim...
                      </div>
                    ) : (
                      "Kirim Link Reset Password"
                    )}
                  </Button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={32} className="text-orange-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Email Terkirim!
                </h2>
                <p className="text-gray-500 text-sm mb-2">
                  Kami telah mengirimkan link reset password ke:
                </p>
                <p className="font-semibold text-gray-800 text-sm mb-4">{email}</p>
                <p className="text-gray-400 text-xs mb-6">
                  Periksa folder spam jika email tidak masuk dalam beberapa menit.
                </p>
                <Button
                  onClick={() => navigate("/signin")}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Kembali ke Login
                </Button>
                <button
                  onClick={() => {
                    setIsSent(false);
                    setEmail("");
                  }}
                  className="mt-3 text-gray-500 hover:text-gray-700 text-sm block mx-auto"
                >
                  Kirim ulang ke email lain
                </button>
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
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-yellow-200/20 rounded-full animate-pulse-slow"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full animate-pulse-slow delay-[2000ms]"></div>
        </div>
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center max-w-md px-4">
          <h3 className="text-2xl font-bold text-orange-700 mb-3">
            Jangan Khawatir!
          </h3>
          <p className="text-gray-600 text-sm">
            Kami akan membantu Anda memulihkan akses ke akun Anda dengan cepat dan aman.
          </p>
        </div>
      </div>
    </div>
  );
}
