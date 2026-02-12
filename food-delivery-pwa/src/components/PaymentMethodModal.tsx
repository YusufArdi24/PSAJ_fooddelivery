import { useState } from "react";
import { X, ChevronDown, Smartphone, CreditCard, Wallet, Banknote } from "lucide-react";
import { Button } from "./ui/button";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => void;
}

const PaymentMethodModal = ({ isOpen, onClose, onConfirm }: PaymentMethodModalProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [showVirtualAccount, setShowVirtualAccount] = useState(false);
  const [showEWallet, setShowEWallet] = useState(false);
  const [selectedVA, setSelectedVA] = useState<string>("");
  const [selectedEWallet, setSelectedEWallet] = useState<string>("");

  const virtualAccounts = [
    { id: "bca", name: "BCA Virtual Account", logo: "🏦" },
    { id: "bri", name: "BRI Virtual Account", logo: "🏛️" },
    { id: "mandiri", name: "Mandiri Virtual Account", logo: "🏦" },
  ];

  const eWallets = [
    { id: "gopay", name: "GoPay", logo: "💚" },
    { id: "ovo", name: "OVO", logo: "💜" },
    { id: "dana", name: "DANA", logo: "💙" },
    { id: "shopee", name: "ShopeePay", logo: "🧡" },
  ];

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method);
    if (method !== "virtual_account") {
      setShowVirtualAccount(false);
      setSelectedVA("");
    }
    if (method !== "e_wallet") {
      setShowEWallet(false);
      setSelectedEWallet("");
    }
  };

  const handleVASelect = (va: string) => {
    setSelectedVA(va);
    setSelectedMethod("virtual_account");
  };

  const handleEWalletSelect = (wallet: string) => {
    setSelectedEWallet(wallet);
    setSelectedMethod("e_wallet");
  };

  const handleNext = () => {
    let paymentMethod = "";
    
    if (selectedMethod === "qris") {
      paymentMethod = "QRIS";
    } else if (selectedMethod === "virtual_account" && selectedVA) {
      const va = virtualAccounts.find(v => v.id === selectedVA);
      paymentMethod = va?.name || "Virtual Account";
    } else if (selectedMethod === "e_wallet" && selectedEWallet) {
      const wallet = eWallets.find(w => w.id === selectedEWallet);
      paymentMethod = wallet?.name || "E-Wallet";
    } else if (selectedMethod === "cash") {
      paymentMethod = "Cash";
    }
    
    if (paymentMethod) {
      onConfirm(paymentMethod);
      onClose();
      // Reset state
      setSelectedMethod("");
      setSelectedVA("");
      setSelectedEWallet("");
      setShowVirtualAccount(false);
      setShowEWallet(false);
    }
  };

  const isValidSelection = () => {
    return selectedMethod === "qris" || 
           selectedMethod === "cash" ||
           (selectedMethod === "virtual_account" && selectedVA) ||
           (selectedMethod === "e_wallet" && selectedEWallet);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-50 animate-in fade-in-0 duration-300"
        onClick={onClose}
      />
      
      {/* Modal Container - Perfect Centered */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <div className="bg-card border border-border rounded-xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-500 transform">
            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1 text-left">
                  <h2 className="text-xl font-semibold text-foreground mb-1">Metode Pembayaran</h2>
                  <p className="text-sm text-muted-foreground">
                    Pilih metode pembayaran di bawah. Periksa kembali sebelum menyelesaikan pembayaran Anda.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 ml-4 hover:bg-muted/50 transition-all duration-200 hover:rotate-90 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

          {/* Payment Options */}
          <div className="p-6 space-y-4 overflow-y-auto max-h-96">
            
            {/* QRIS */}
            <div 
              onClick={() => handleMethodSelect("qris")}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMethod === "qris" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium text-foreground">QRIS</span>
              </div>
              {selectedMethod === "qris" && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>

            {/* Virtual Account */}
            <div>
              <div 
                onClick={() => {
                  setShowVirtualAccount(!showVirtualAccount);
                  handleMethodSelect("virtual_account");
                }}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethod === "virtual_account" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="font-medium text-foreground">Virtual Account</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                  showVirtualAccount ? "rotate-180" : ""
                }`} />
              </div>

              {/* VA Dropdown */}
              {showVirtualAccount && (
                <div className="mt-2 ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {virtualAccounts.map((va) => (
                    <div
                      key={va.id}
                      onClick={() => handleVASelect(va.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedVA === va.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{va.logo}</span>
                        <span className="text-sm font-medium text-foreground">{va.name}</span>
                      </div>
                      {selectedVA === va.id && (
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
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
                  handleMethodSelect("e_wallet");
                }}
                className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedMethod === "e_wallet" 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-purple-500" />
                  </div>
                  <span className="font-medium text-foreground">E-Wallet</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${
                  showEWallet ? "rotate-180" : ""
                }`} />
              </div>

              {/* E-Wallet Dropdown */}
              {showEWallet && (
                <div className="mt-2 ml-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {eWallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      onClick={() => handleEWalletSelect(wallet.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedEWallet === wallet.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{wallet.logo}</span>
                        <span className="text-sm font-medium text-foreground">{wallet.name}</span>
                      </div>
                      {selectedEWallet === wallet.id && (
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cash */}
            <div 
              onClick={() => handleMethodSelect("cash")}
              className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedMethod === "cash" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-green-500" />
                </div>
                <span className="font-medium text-foreground">Cash</span>
              </div>
              {selectedMethod === "cash" && (
                <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border animate-in slide-in-from-bottom-2 duration-600">
            <Button
              onClick={handleNext}
              disabled={!isValidSelection()}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none"
            >
              Lanjutkan
            </Button>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentMethodModal;