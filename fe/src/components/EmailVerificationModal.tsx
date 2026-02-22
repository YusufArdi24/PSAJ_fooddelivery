import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, RefreshCw, X } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "./ui/use-toast";
import { resendVerificationEmail } from "../services/authService";

interface EmailVerificationModalProps {
  email: string;
  onClose: () => void;
}

export default function EmailVerificationModal({ email, onClose }: EmailVerificationModalProps) {
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result.success) {
        toast({
          title: "Email Terkirim",
          description: "Email verifikasi baru telah dikirimkan. Cek inbox atau folder spam.",
        });
        startCooldown();
      } else {
        throw new Error(result.message || "Gagal mengirim ulang email");
      }
    } catch (err: any) {
      toast({
        title: "Gagal Mengirim",
        description: err.message || "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative overflow-hidden">
        {/* Orange top accent */}
        <div className="h-1.5 bg-gradient-to-r from-orange-500 to-amber-400 w-full" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={32} className="text-orange-600" />
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
            Verifikasi Email Anda
          </h2>
          <p className="text-gray-500 text-xs text-center mb-1">
            Email verifikasi telah dikirim ke:
          </p>
          <p className="font-semibold text-gray-800 text-sm text-center mb-4 break-all">
            {email}
          </p>

          {/* Info */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
            <p className="text-amber-800 text-xs leading-relaxed">
              ⚠️ Akun Anda belum diverifikasi.{" "}
              <span className="font-medium">Anda tidak dapat memesan makanan</span> sampai
              email diverifikasi. Klik link di email untuk mengaktifkan akun.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              variant="outline"
              className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              {isResending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600" />
                  Mengirim...
                </span>
              ) : cooldown > 0 ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={15} />
                  Kirim ulang ({cooldown}s)
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw size={15} />
                  Kirim Ulang Email Verifikasi
                </span>
              )}
            </Button>

            <Button
              onClick={() => navigate("/verify-email", { state: { email } })}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              Lihat Panduan Verifikasi
            </Button>

            <button
              onClick={onClose}
              className="w-full text-gray-400 hover:text-gray-600 text-xs py-1"
            >
              Nanti saja, lanjut browsing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
