import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorMessage = searchParams.get("message") || "Pembayaran gagal diproses";
  const orderId = searchParams.get("order_id");

  const handleRetry = () => {
    if (orderId) {
      navigate(`/orders`);
    } else {
      navigate("/dashboard");
    }
  };

  const handleBackToOrders = () => {
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 flex flex-col items-center gap-6">
          <div className="rounded-full bg-red-100 p-4">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pembayaran Gagal
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-red-600">Gagal</span>
            </div>
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-semibold">{orderId}</span>
              </div>
            )}
          </div>

          <div className="w-full space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                ⚠️ Pembayaran Anda tidak berhasil diproses. Silakan coba lagi atau
                gunakan metode pembayaran lain.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 Jika masalah berlanjut, hubungi dukungan pelanggan kami.
              </p>
            </div>
          </div>

          <div className="w-full space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              Coba Lagi
            </Button>
            <Button
              variant="outline"
              onClick={handleBackToOrders}
              className="w-full"
            >
              Kembali ke Riwayat Pesanan
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Pesanan Anda masih tersimpan dan dapat diselesaikan kapan saja
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
