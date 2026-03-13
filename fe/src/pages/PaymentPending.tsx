import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentPending() {
  const navigate = useNavigate();

  const handleBackToOrders = () => {
    navigate("/orders");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 flex flex-col items-center gap-6">
          <div className="rounded-full bg-yellow-100 p-4">
            <Clock className="h-12 w-12 text-yellow-600" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pembayaran Sedang Diproses
            </h2>
            <p className="text-gray-600 mb-6">
              Pembayaran Anda sedang kami verifikasi. Harap tunggu konfirmasi dari
              penyedia layanan pembayaran.
            </p>
          </div>

          <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-semibold text-yellow-600">Menunggu Konfirmasi</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Waktu Tunggu:</span>
              <span className="font-semibold">Hingga 24 jam</span>
            </div>
          </div>

          <div className="w-full space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                ℹ️ Pembayaran virtual account biasanya dikonfirmasi dalam 15 menit
                setelah transfer.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📱 Kami akan memberi tahu Anda saat pembayaran dikonfirmasi.
              </p>
            </div>
          </div>

          <Button
            onClick={handleBackToOrders}
            className="w-full bg-yellow-600 hover:bg-yellow-700"
          >
            Lihat Riwayat Pesanan
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Jangan tutup halaman ini sampai proses selesai
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
