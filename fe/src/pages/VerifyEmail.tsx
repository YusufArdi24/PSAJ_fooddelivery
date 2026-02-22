import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ChefHat, UtensilsCrossed, Coffee, Croissant, Mail, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "../components/ui/use-toast";
import { resendVerificationEmail, verifyEmailToken, verifyOtp, resendOtpCode } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import Logo from "../assets/warungedin.png";

type VerifyState = "idle" | "verifying" | "success" | "error" | "already_verified";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout, refreshUser } = useAuth();

  // Query params from Gmail link
  const paramId    = searchParams.get("id");
  const paramHash  = searchParams.get("hash");
  const paramEmail = searchParams.get("email");

  // Email to display — check localStorage wdn_email as fallback for pending OTP flow
  const displayEmail: string = paramEmail || (location.state as any)?.email || localStorage.getItem('wdn_email') || user?.email || "";

  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [errorMsg, setErrorMsg]       = useState("");
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown]       = useState(0);
  // hasSent=true when the backend already sent the email (sign-up or Google login)
  const [hasSent, setHasSent]         = useState<boolean>((location.state as any)?.hasSent ?? false);

  // ── OTP mode (pending registration flow) ─────────────────────────────────
  const pendingToken = localStorage.getItem('wdn_pt');
  const isOtpMode    = Boolean(pendingToken);
  const [otpDigits, setOtpDigits]     = useState(['', '', '', '', '', '']);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // ─────────────────────────────────────────────────────────────────────────

  // Auto-verify when landing from Gmail link
  useEffect(() => {
    if (paramId && paramHash && paramEmail) {
      autoVerify();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const autoVerify = async () => {
    setVerifyState("verifying");
    try {
      const result = await verifyEmailToken(paramId!, paramHash!, paramEmail!);
      if (result.success) {
        setVerifyState(result.already_verified ? "already_verified" : "success");
        // verifyEmailToken already stored the fresh token + customer in localStorage.
        // Now sync the React auth context so `user` state is up-to-date.
        try { await refreshUser(); } catch (_) {}
      } else {
        throw new Error(result.message || "Verifikasi gagal");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Link tidak valid atau sudah kadaluarsa.");
      setVerifyState("error");
    }
  };

  // ── OTP handlers ─────────────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(0, 1);
    const next = [...otpDigits];
    next[index] = v;
    setOtpDigits(next);
    if (v && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtpDigits(pasted.split(''));
      otpInputRefs.current[5]?.focus();
      e.preventDefault();
    }
  };

  const handleOtpSubmit = async () => {
    const otp = otpDigits.join('');
    if (otp.length < 6) {
      toast({ title: 'OTP tidak lengkap', description: 'Masukkan semua 6 digit kode OTP.', variant: 'destructive' });
      return;
    }
    if (!pendingToken) return;
    setIsVerifyingOtp(true);
    try {
      const result = await verifyOtp(pendingToken, otp);
      if (result.success) {
        toast({ title: 'Email Terverifikasi', description: 'Lanjutkan untuk melengkapi profil Anda.' });
        navigate('/complete-profile');
      } else {
        throw new Error(result.message || 'OTP tidak valid');
      }
    } catch (err: any) {
      toast({ title: 'Verifikasi Gagal', description: err.message || 'Kode OTP salah atau sudah kadaluarsa.', variant: 'destructive' });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!pendingToken) return;
    setIsResendingOtp(true);
    try {
      const result = await resendOtpCode(pendingToken);
      if (result.success) {
        setOtpDigits(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        toast({ title: 'Kode Baru Dikirim', description: 'Kode OTP baru telah dikirimkan ke email Anda.' });
        setOtpCooldown(60);
        const iv = setInterval(() => setOtpCooldown(p => { if (p <= 1) { clearInterval(iv); return 0; } return p - 1; }), 1000);
      } else {
        throw new Error(result.message || 'Gagal mengirim OTP');
      }
    } catch (err: any) {
      toast({ title: 'Gagal', description: err.message || 'Terjadi kesalahan.', variant: 'destructive' });
    } finally {
      setIsResendingOtp(false);
    }
  };
  // ─────────────────────────────────────────────────────────────────────────

  // Resend cooldown timer
  const startCooldown = () => {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!displayEmail) {
      toast({ title: "Email tidak ditemukan", description: "Silakan login kembali dan coba lagi.", variant: "destructive" });
      return;
    }
    setIsResending(true);
    try {
      const result = await resendVerificationEmail(displayEmail);
      if (result.success) {
        toast({ title: "Email Terkirim", description: hasSent ? "Email verifikasi baru telah dikirimkan." : "Email verifikasi telah dikirimkan. Cek inbox Anda." });
        setHasSent(true);
        startCooldown();
      } else {
        throw new Error(result.message || "Gagal mengirim ulang email");
      }
    } catch (err: any) {
      toast({ title: "Gagal", description: err.message || "Terjadi kesalahan. Silakan coba lagi.", variant: "destructive" });
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  // Where to go after successful verification (email-link mode)
  const handleContinue = () => navigate("/complete-profile");

  // ── Render helpers ─────────────────────────────────────────────────────

  const ResendButton = () => (
    <Button
      onClick={handleResend}
      disabled={isResending || cooldown > 0}
      variant="outline"
      className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 mb-3"
    >
      {isResending ? (
        <span className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600" />
          Mengirim...
        </span>
      ) : cooldown > 0 ? (
        <span className="flex items-center gap-2"><RefreshCw size={15} />Kirim ulang ({cooldown}s)</span>
      ) : hasSent ? (
        <span className="flex items-center gap-2"><RefreshCw size={15} />Kirim Ulang Email Verifikasi</span>
      ) : (
        <span className="flex items-center gap-2"><Mail size={15} />Kirim Email Verifikasi</span>
      )}
    </Button>
  );

  const renderContent = () => {
    // ── OTP MODE (pending registration): enter 6-digit code ──────────────
    if (isOtpMode) return (
      <div className="py-2">
        <div className="text-center mb-5">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail size={32} className="text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Masukkan Kode OTP</h1>
          <p className="text-gray-500 text-sm">
            Kode 6 digit telah dikirim ke
            {displayEmail && <><br /><span className="font-semibold text-gray-700">{displayEmail}</span></>}
          </p>
          <p className="text-gray-400 text-xs mt-1">Kode berlaku selama 10 menit.</p>
        </div>

        {/* 6-digit OTP inputs */}
        <div className="flex gap-2 justify-center mb-5">
          {otpDigits.map((digit, i) => (
            <Input
              key={i}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              ref={el => { otpInputRefs.current[i] = el; }}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              className="w-10 h-12 text-center text-xl font-bold border-gray-300 focus:border-orange-500"
            />
          ))}
        </div>

        <Button
          onClick={handleOtpSubmit}
          disabled={isVerifyingOtp || otpDigits.join('').length < 6}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg mb-3"
        >
          {isVerifyingOtp ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 size={16} className="animate-spin" /> Memverifikasi...
            </span>
          ) : 'Verifikasi'}
        </Button>

        <Button
          onClick={handleResendOtp}
          disabled={isResendingOtp || otpCooldown > 0}
          variant="outline"
          className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          {isResendingOtp ? (
            <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Mengirim...</span>
          ) : otpCooldown > 0 ? (
            <span className="flex items-center gap-2"><RefreshCw size={14} />Kirim ulang ({otpCooldown}s)</span>
          ) : (
            <span className="flex items-center gap-2"><RefreshCw size={14} />Kirim Ulang Kode</span>
          )}
        </Button>

        <div className="text-center mt-4">
          <button
            onClick={() => { localStorage.removeItem('wdn_pt'); localStorage.removeItem('wdn_email'); navigate('/signup'); }}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            Daftar dengan akun lain
          </button>
        </div>
      </div>
    );

    // VERIFYING
    if (verifyState === "verifying") return (
      <div className="text-center py-6">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 size={40} className="text-orange-600 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Memverifikasi Email...</h2>
        <p className="text-gray-500 text-sm">Mohon tunggu sebentar.</p>
      </div>
    );

    // SUCCESS / ALREADY VERIFIED
    if (verifyState === "success" || verifyState === "already_verified") return (
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {verifyState === "already_verified" ? "Email Sudah Terverifikasi" : "Email Berhasil Diverifikasi! 🎉"}
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          {verifyState === "already_verified"
            ? "Akun Anda sudah aktif sebelumnya. Silakan lanjutkan."
            : "Akun Anda telah aktif. Selamat menikmati layanan Warung Edin!"}
        </p>
        <Button
          onClick={handleContinue}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5 rounded-lg"
        >
          Lanjutkan →
        </Button>
      </div>
    );

    // ERROR
    if (verifyState === "error") return (
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={40} className="text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Verifikasi Gagal</h2>
        <p className="text-gray-500 text-sm mb-2">{errorMsg}</p>
        <p className="text-gray-400 text-xs mb-6">
          Link berlaku 60 menit. Minta link baru di bawah jika sudah kadaluarsa.
        </p>
        {displayEmail && <ResendButton />}
        <Button onClick={() => navigate("/signin")} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
          Kembali ke Login
        </Button>
      </div>
    );

    // IDLE — instructions
    return (
      <>
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail size={40} className="text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verifikasi Email Anda</h1>
          <p className="text-gray-500 text-sm mb-1">Kami telah mengirimkan email verifikasi ke:</p>
          {displayEmail && <p className="font-semibold text-gray-800 text-sm mb-3">{displayEmail}</p>}
          <p className="text-gray-400 text-xs leading-relaxed">
            Klik link di email untuk mengaktifkan akun Anda. Periksa folder{" "}
            <span className="font-medium">spam</span> jika email tidak masuk dalam beberapa menit.
          </p>
        </div>

        <div className="bg-orange-50 rounded-lg p-4 mb-6 space-y-2">
          <p className="text-xs font-semibold text-orange-700 mb-2">Langkah selanjutnya:</p>
          {[
            "Buka email dari Warung Edin",
            'Klik tombol "Verifikasi Email"',
            "Anda akan otomatis diarahkan ke langkah berikutnya",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 bg-orange-600 text-white rounded-full text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <p className="text-xs text-gray-600">{step}</p>
            </div>
          ))}
        </div>

        <ResendButton />

        {/* Hidden on desktop */}
        <Button onClick={() => navigate("/signin")} className="w-full bg-orange-600 hover:bg-orange-700 text-white lg:hidden">
          Sudah Verifikasi? Login Sekarang
        </Button>
        <div className="text-center mt-4 lg:hidden">
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 text-xs">
            Gunakan akun lain
          </button>
        </div>
      </>
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-[#fafafa] flex">
      {/* Left Side */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:justify-start lg:pl-16 xl:pl-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-sm pb-6 px-6 sm:pb-8 sm:px-8 border border-gray-100">
            <div className="text-center">
              <img src={Logo} alt="Warung Edin" className="h-30 w-36 mx-auto mt-8 mb-4" />
            </div>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-8 relative overflow-hidden bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white to-yellow-50/50" />
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
            <div className="w-64 h-64 border-4 border-orange-200/30 rounded-full animate-pulse-slow" />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-80 h-80 border-2 border-orange-100/20 rounded-full animate-pulse-slow delay-[1000ms]" />
          </div>

          {/* Background Shapes */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-yellow-200/20 rounded-full animate-pulse-slow" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-yellow-200/20 to-orange-200/20 rounded-full animate-pulse-slow delay-[2000ms]" />

          {/* Small Accent Circles */}
          <div className="absolute top-1/5 right-1/4 w-3 h-3 bg-orange-400/40 rounded-full animate-float-1" />
          <div className="absolute bottom-1/4 right-1/3 w-4 h-4 bg-yellow-400/40 rounded-full animate-float-2" />
          <div className="absolute top-3/4 left-1/3 w-2 h-2 bg-orange-300/40 rounded-full animate-float-3" />
        </div>
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 text-center max-w-md px-4">
          <h3 className="text-2xl font-bold text-orange-700 mb-3">Periksa Email Anda</h3>
          <p className="text-gray-600 text-sm">
            Verifikasi email Anda, lalu lengkapi profil dan lokasi untuk mulai memesan makanan favorit.
          </p>
        </div>
      </div>
    </div>
  );
}