import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentFinish() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading payment status
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleBackToOrders = () => {
    navigate("/orders");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 flex flex-col items-center gap-6">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Memproses Pembayaran
              </h2>
              <p className="text-gray-600">
                Mohon tunggu sebentar...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 flex flex-col items-center gap-6">
          <div className="rounded-full bg-green-100 p-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pembayaran Berhasil!
            </h2>
            <p className="text-gray-600 mb-6">
              Pesanan Anda telah dikonfirmasi dan akan segera diproses.
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status Pesanan:</span>
              <span className="font-semibold text-green-600">Dikonfirmasi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimasi Waktu:</span>
              <span className="font-semibold">15-30 menit</span>
            </div>
          </div>

          <div className="w-full bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📱 Pantau status pesanan Anda di halaman riwayat pesanan
            </p>
          </div>

          <Button
            onClick={handleBackToOrders}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Lihat Riwayat Pesanan
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
