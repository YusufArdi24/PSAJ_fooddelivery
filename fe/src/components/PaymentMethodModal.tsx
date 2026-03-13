import { useState } from "react";
import { X, ChevronDown, CreditCard, Wallet, Banknote, Smartphone, Check } from "lucide-react";
import { Button } from "./ui/button";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string, methodId: string) => void;
  isPlacingOrder?: boolean;
}

// Helper component for bank/ewallet logo - supports both image and fallback text
const PaymentLogo = ({ logo, color, imageUrl }: { logo: string; color: string; imageUrl?: string }) => {
  const [imageError, setImageError] = useState(false);

  // If imageUrl is provided and no error, try to load it
  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={logo}
        className="w-12 h-12 rounded-lg object-cover"
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to colored background with text logo
  return (
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xs ${color}`}>
      {logo}
    </div>
  );
};

const PaymentMethodModal = ({
  isOpen,
  onClose,
  onConfirm,
  isPlacingOrder = false,
}: PaymentMethodModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [showBankAccounts, setShowBankAccounts] = useState(false);
  const [showEWallet, setShowEWallet] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [selectedWallet, setSelectedWallet] = useState<string>("");

  // Bank Virtual Accounts
  const bankAccounts = [
    { id: "bca", name: "BCA Virtual Account", logo: "BCA", color: "bg-blue-600", imageUrl: "/payment-methods/bca.png" },
    { id: "bni", name: "BNI Virtual Account", logo: "BNI", color: "bg-yellow-500", imageUrl: "/payment-methods/bni.png" },
    { id: "bri", name: "BRI Virtual Account", logo: "BRI", color: "bg-red-600", imageUrl: "/payment-methods/bri.png" },
    { id: "mandiri", name: "Mandiri Bill Payment", logo: "MDI", color: "bg-orange-600", imageUrl: "/payment-methods/mandiri.png" },
  ];

  // E-Wallets (Midtrans powered)
  const eWallets = [
    { id: "gopay", name: "GoPay", logo: "G", color: "bg-green-500", imageUrl: "/payment-methods/gopay.png" },
    { id: "ovo", name: "OVO", logo: "OVO", color: "bg-purple-600", imageUrl: "/payment-methods/ovo.png" },
    { id: "dana", name: "DANA", logo: "DA", color: "bg-blue-500", imageUrl: "/payment-methods/dana.png" },
    { id: "shopeepay", name: "ShopeePay", logo: "SP", color: "bg-red-500", imageUrl: "/payment-methods/shopeepay.png" },
    { id: "linkaja", name: "LinkAja", logo: "LA", color: "bg-purple-700", imageUrl: "/payment-methods/linkaja.png" },
  ];

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
  };

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    setSelectedMethod("bank");
  };

  const handleWalletSelect = (walletId: string) => {
    setSelectedWallet(walletId);
    setSelectedMethod("ewallet");
  };

  const handleConfirmClick = () => {
    let methodId = "";
    let methodName = "";

    if (selectedMethod === "cash") {
      methodId = "cash";
      methodName = "Cash on Delivery";
    } else if (selectedMethod === "qris") {
      methodId = "qris";
      methodName = "QRIS";
    } else if (selectedMethod === "bank" && selectedBank) {
      const bank = bankAccounts.find((b) => b.id === selectedBank);
      methodId = selectedBank;
      methodName = bank?.name || "Bank Virtual Account";
    } else if (selectedMethod === "ewallet" && selectedWallet) {
      const wallet = eWallets.find((w) => w.id === selectedWallet);
      methodId = selectedWallet;
      methodName = wallet?.name || "E-Wallet";
    }

    if (methodId && methodName) {
      onConfirm(methodName, methodId);
      // Reset state
      setSelectedMethod("");
      setSelectedBank("");
      setSelectedWallet("");
      setShowBankAccounts(false);
      setShowEWallet(false);
    }
  };

  const isValidSelection = () => {
    return (
      selectedMethod === "cash" ||
      selectedMethod === "qris" ||
      (selectedMethod === "bank" && selectedBank) ||
      (selectedMethod === "ewallet" && selectedWallet)
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-50 animate-in fade-in-0 duration-300"
        onClick={isPlacingOrder ? undefined : onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-500 transform">
            {/* Header */}
            <div className="p-6 border-b border-border bg-gradient-to-r from-orange-500/10 to-primary/10">
              <div className="flex items-start justify-between">
                <div className="flex-1 text-left">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    Metode Pembayaran
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Pilih metode pembayaran yang Anda inginkan
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isPlacingOrder}
                  className="h-8 w-8 p-0 ml-4 hover:bg-muted/50 transition-all duration-200 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Payment Options */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Cash on Delivery */}
              <div
                onClick={() => handleMethodSelect("cash")}
                className={`group flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethod === "cash"
                    ? "border-green-500 bg-green-50 dark:bg-green-950/30"
                    : "border-border hover:border-green-500/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">Bayar Nanti</h3>
                    <p className="text-xs text-muted-foreground">
                      Bayar saat pesanan tiba (COD)
                    </p>
                  </div>
                </div>
                {selectedMethod === "cash" && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* QRIS */}
              <div
                onClick={() => handleMethodSelect("qris")}
                className={`group flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethod === "qris"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-foreground">QRIS</h3>
                    <p className="text-xs text-muted-foreground">
                      Scan QR dari berbagai dompet digital
                    </p>
                  </div>
                </div>
                {selectedMethod === "qris" && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Virtual Account / Bank Transfer */}
              <div>
                <div
                  onClick={() => {
                    setShowBankAccounts(!showBankAccounts);
                    if (!showBankAccounts) {
                      handleMethodSelect("bank");
                    }
                  }}
                  className={`group flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMethod === "bank"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-border hover:border-blue-500/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-foreground">
                        Transfer Bank
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Virtual Account dari BCA, BNI, BRI, Mandiri
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                      showBankAccounts ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* Bank Options */}
                {showBankAccounts && (
                  <div className="mt-2 ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {bankAccounts.map((bank) => (
                      <div
                        key={bank.id}
                        onClick={() => handleBankSelect(bank.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedBank === bank.id
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                            : "border-border hover:border-blue-500/30 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <PaymentLogo
                            logo={bank.logo}
                            color={bank.color}
                            imageUrl={bank.imageUrl}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {bank.name}
                          </span>
                        </div>
                        {selectedBank === bank.id && (
                          <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* E-Wallet */}
              <div>
                <div
                  onClick={() => {
                    setShowEWallet(!showEWallet);
                    if (!showEWallet) {
                      handleMethodSelect("ewallet");
                    }
                  }}
                  className={`group flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedMethod === "ewallet"
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30"
                      : "border-border hover:border-purple-500/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-foreground">E-Wallet</h3>
                      <p className="text-xs text-muted-foreground">
                        GoPay, OVO, DANA, ShopeePay, LinkAja
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                      showEWallet ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {/* E-Wallet Options */}
                {showEWallet && (
                  <div className="mt-2 ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {eWallets.map((wallet) => (
                      <div
                        key={wallet.id}
                        onClick={() => handleWalletSelect(wallet.id)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedWallet === wallet.id
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                            : "border-border hover:border-purple-500/30 hover:bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <PaymentLogo
                            logo={wallet.logo}
                            color={wallet.color}
                            imageUrl={wallet.imageUrl}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {wallet.name}
                          </span>
                        </div>
                        {selectedWallet === wallet.id && (
                          <Check className="w-4 h-4 text-purple-500 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isPlacingOrder}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmClick}
                disabled={!isValidSelection() || isPlacingOrder}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                {isPlacingOrder ? "Memproses..." : "Lanjutkan Pembayaran"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentMethodModal;