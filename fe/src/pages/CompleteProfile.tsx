import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Phone, ChefHat, UtensilsCrossed, Coffee, Croissant } from "lucide-react";
import Logo from "/warungedin.png";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../components/ui/use-toast";
import { updateCustomerProfile } from "../services/authService";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): boolean => {
    if (!phone.trim()) {
      setError("Nomor telepon wajib diisi");
      return false;
    }
    if (!/^[0-9]{10,15}$/.test(phone.replace(/[\s-]/g, ""))) {
      setError("Masukkan nomor telepon yang valid (10-15 digit)");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    const pendingToken = localStorage.getItem('wdn_pt');

    try {
      if (pendingToken) {
        // Pending registration flow: just store phone, no API call yet
        localStorage.setItem('wdn_phone', phone);
        localStorage.setItem('isFirstLogin', 'true');
        toast({
          title: 'Nomor telepon disimpan',
          description: 'Sekarang atur lokasi pengiriman Anda.',
        });
        navigate('/location');
      } else {
        // Normal authenticated flow
        const result = await updateCustomerProfile({ phone });
        if (result && result.success) {
          try { await refreshUser(); } catch (_) {}
          localStorage.setItem('isFirstLogin', 'true');
          toast({
            title: 'Nomor telepon disimpan',
            description: 'Sekarang atur lokasi pengiriman Anda.',
          });
          navigate('/location');
        } else {
          throw new Error(result?.message || 'Gagal menyimpan nomor telepon');
        }
      }
    } catch (err: any) {
      toast({
        title: 'Gagal menyimpan',
        description: err.message || 'Terjadi kesalahan. Coba lagi.',
        variant: 'destructive',
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
          <div className="bg-white rounded-xl shadow-sm pb-4 px-4 sm:pb-5 sm:px-5 border border-gray-100">
            {/* Logo */}
            <div className="text-center">
              <img
                src={Logo}
                alt="Warung Edin"
                className="h-24 w-auto mx-auto mt-6 mb-3"
              />
            </div>

            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mb-3">
                <Phone size={22} className="text-orange-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Lengkapi Profil Anda
              </h1>
              <p className="text-gray-600 text-xs">
                Tambahkan nomor telepon agar pesanan Anda dapat diproses dengan mudah.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label
                  htmlFor="phone"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Nomor Telepon
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Contoh: 08123456789"
                  className={`w-full ${
                    error
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200"
                  }`}
                />
                {error && (
                  <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </div>
                ) : (
                  "Simpan & Lanjutkan"
                )}
              </Button>
            </form>

            <p className="text-center text-gray-500 text-xs mt-4">
              Nomor telepon digunakan untuk konfirmasi pesanan Anda.
            </p>
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

          <div className="absolute top-1/4 left-1/3 animate-float-1">
            <UtensilsCrossed size={40} className="text-orange-600/70" strokeWidth={1.5} />
          </div>
          <div className="absolute top-2/3 left-2/3 animate-float-2">
            <UtensilsCrossed size={32} className="text-orange-500/60" strokeWidth={1.5} />
          </div>
          <div className="absolute top-1/2 right-1/3 animate-float-3">
            <Coffee size={44} className="text-amber-600/70" strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-1/3 left-1/4 animate-float-1 delay-1000">
            <Croissant size={36} className="text-yellow-600/70" strokeWidth={1.5} />
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
            Hampir Selesai!
          </h3>
          <p className="text-gray-600 text-sm">
            Tambahkan nomor telepon dan atur lokasi Anda untuk mulai memesan makanan lezat dari warung favorit.
          </p>
        </div>
      </div>
    </div>
  );
}
