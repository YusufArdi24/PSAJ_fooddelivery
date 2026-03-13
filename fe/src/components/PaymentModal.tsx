import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import {
  createSnapTransaction,
  openMidtransPayment,
  initializeMidtransSnap,
  PaymentMethod,
} from "@/services/paymentService";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderTotal: number;
  paymentMethod: PaymentMethod | null;
  clientKey: string;
  snapUrl: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  paymentMethod,
  clientKey,
  snapUrl,
}: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapInitialized, setSnapInitialized] = useState(false);

  // Initialize Midtrans Snap on component mount
  useEffect(() => {
    if (isOpen && clientKey && snapUrl && !snapInitialized) {
      initializeMidtransSnap(snapUrl)
        .then(() => {
          setSnapInitialized(true);
        })
        .catch((err) => {
          console.error("Failed to initialize Snap:", err);
          setError("Gagal memuat payment gateway. Silakan refresh halaman.");
        });
    }
  }, [isOpen, clientKey, snapUrl, snapInitialized]);

  const handlePayment = async () => {
    if (!paymentMethod) {
      setError("Silakan pilih metode pembayaran");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create Snap transaction
      const response = await createSnapTransaction(orderId, paymentMethod.key);

      if (!response.success) {
        setError(
          response.message || "Gagal membuat transaksi pembayaran"
        );
        return;
      }

      const { snap_token } = response.data;

      // Open Midtrans payment modal
      await openMidtransPayment(snap_token);

      // Payment flow handled by Midtrans
      // Webhook will update payment status automatically
      toast({
        title: "Pembayaran Diproses",
        description: "Silakan ikuti instruksi pembayaran di aplikasi Midtrans",
      });

      // Close modal after payment flow
      onClose();
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(
        err.message || "Terjadi kesalahan saat memproses pembayaran"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!paymentMethod) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          <DialogDescription>
            Lanjutkan pembayaran pesanan Anda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Method Summary */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-sm text-gray-700 mb-3">
              Rincian Pembayaran
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Metode Pembayaran:</span>
                <span className="font-medium">{paymentMethod.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Pembayaran:</span>
                <span className="font-semibold text-lg text-green-600">
                  Rp {orderTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>

          {/* Method Description */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              {paymentMethod.description}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-100 bg-red-50 p-3 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Payment Instructions */}
          <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              Anda akan diarahkan ke halaman pembayaran. Ikuti instruksi untuk
              menyelesaikan pembayaran.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isLoading || !snapInitialized}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                `Bayar Rp ${orderTotal.toLocaleString("id-ID")}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
