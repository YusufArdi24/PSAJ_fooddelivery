import { X, MapPin, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import ConfirmDialog from "./ConfirmDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import LeafletLocationPicker from "./LeafletLocationPicker";
import { useState } from "react";

interface CartItem {
  id: string;
  menuId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selected_variant?: string;
  variants?: string[];
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onUpdateVariant: (id: string, newVariant: string) => void;
  deliverAddress: string;
  onUpdateAddress: (address: string) => void;
  addressLabel?: string;
  onUpdateAddressLabel?: (label: string) => void;
  addressNotes?: string;
  onUpdateAddressNotes?: (notes: string) => void;
  note: string;
  onUpdateNote: (note: string) => void;
  onConfirmPayment: () => void;
  isPlacingOrder?: boolean;
}

const CartSidebar = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearAll,
  onUpdateVariant,
  deliverAddress,
  onUpdateAddress,
  addressLabel,
  onUpdateAddressLabel,
  addressNotes,
  onUpdateAddressNotes,
  note,
  onUpdateNote,
  onConfirmPayment,
  isPlacingOrder = false,
}: CartSidebarProps) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const grandTotal = subtotal;

  const handleClearAllClick = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    onClearAll();
    setShowClearConfirm(false);
  };

  const handleConfirmPaymentClick = () => {
    // Directly trigger payment confirmation - Midtrans modal will appear
    onConfirmPayment();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-in fade-in-0"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-card border-l border-border z-50 flex flex-col animate-in slide-in-from-right-2 duration-300 shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between animate-in slide-in-from-top-2 duration-500">
          <h2 className="text-lg font-semibold text-foreground">Pesanan Saat Ini</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted/50 transition-all duration-200 hover:scale-110 hover:rotate-90"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Deliver Address */}
          <div className="p-4 border-b border-border animate-in slide-in-from-right-2 duration-700">
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-500" />
              Alamat Pengiriman
            </h3>
            
            {/* Location Picker with Map */}
            <div className="bg-muted/30 rounded-lg p-3 border border-border mb-3">
              <LeafletLocationPicker
                onLocationSelect={(data) => {
                  onUpdateAddress(data.address);
                }}
                defaultLocation={undefined}
                mapHeight="h-32"
                compact={true}
              />
            </div>

            {/* Address Label (Editable) */}
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Label Alamat *
              </Label>
              <Select 
                value={addressLabel || 'default'} 
                onValueChange={(value) => onUpdateAddressLabel && onUpdateAddressLabel(value === 'default' ? '' : value)}
              >
                <SelectTrigger className="w-full text-sm h-9">
                  <SelectValue placeholder="Pilih label alamat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Alamat Default</SelectItem>
                  <SelectItem value="Rumah">Rumah</SelectItem>
                  <SelectItem value="Kantor">Kantor</SelectItem>
                  <SelectItem value="Apartemen">Apartemen</SelectItem>
                  <SelectItem value="Kos">Kos</SelectItem>
                  <SelectItem value="Lainnya">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alamat Lengkap (Read-only, from map) */}
            {deliverAddress && (
              <div className="mb-3">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  Alamat Lengkap
                </Label>
                <Textarea
                  value={deliverAddress}
                  readOnly
                  className="w-full text-sm text-foreground bg-muted/50 border border-border rounded-md p-2 resize-none"
                  rows={3}
                />
              </div>
            )}
            
            {/* Address Notes (Editable) */}
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">
                Catatan Alamat *
              </Label>
              <Input
                value={addressNotes || ''}
                onChange={(e) => onUpdateAddressNotes && onUpdateAddressNotes(e.target.value)}
                placeholder="Contoh: Blok A1 No. 1, Gang Bima, Rumah warna putih"
                className="w-full text-sm h-9"
              />
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 italic">Alamat ini hanya untuk pesanan ini. Alamat default Anda tidak akan berubah.</p>
          </div>

          {/* Order Items */}
          <div className="p-4 animate-in slide-in-from-right-2 duration-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-foreground">Item Pesanan</h3>
              {cartItems.length > 0 && (
                <button
                  onClick={handleClearAllClick}
                  className="group flex items-center gap-2 text-xs text-red-500 hover:text-red-600 font-medium transition-all duration-200 hover:scale-105 px-2 py-1 rounded-md hover:bg-red-50/50"
                >
                  <Trash2 className="w-3 h-3 transition-transform group-hover:rotate-12" />
                  Hapus semua item
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div className="text-center py-8 animate-in fade-in-0 duration-1000">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/30 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🛒</span>
                </div>
                <p className="text-muted-foreground text-sm">No items in cart</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center gap-3 animate-in slide-in-from-bottom-2 hover:bg-muted/20 p-2 rounded-lg transition-all duration-200 animation-delay-${Math.min(index, 9) * 100}`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm font-medium text-primary">
                        Rp {item.price.toLocaleString()} 
                        <span className="text-xs text-muted-foreground ml-1">
                          x{item.quantity}
                        </span>
                      </p>
                      {item.variants && item.variants.length > 0 && (
                        <Select
                          value={item.selected_variant ?? ""}
                          onValueChange={(val) => onUpdateVariant(item.id, val)}
                        >
                          <SelectTrigger className="h-6 text-xs mt-1 px-2 py-0 border-border">
                            <SelectValue placeholder="Pilih varian" />
                          </SelectTrigger>
                          <SelectContent>
                            {item.variants.map((v) => (
                              <SelectItem key={v} value={v} className="text-xs">
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          if (item.quantity > 1) {
                            onUpdateQuantity(item.id, item.quantity - 1);
                          } else {
                            onRemoveItem(item.id);
                          }
                        }}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {cartItems.length > 0 && (
            <>
              <div className="px-4 py-2 border-t border-border space-y-2 animate-in slide-in-from-bottom-2 duration-1000">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-sm font-medium">Rp {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-base font-semibold text-foreground">Grand Total</span>
                  <span className="text-base font-semibold text-primary">
                    Rp {grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Note */}
              <div className="p-4 border-t border-border animate-in slide-in-from-bottom-2 duration-1100">
                <h3 className="text-sm font-medium text-foreground mb-2">Catatan</h3>
                <textarea
                  value={note}
                  onChange={(e) => onUpdateNote(e.target.value)}
                  placeholder="Tolong tambahin sambelnya yang banyak"
                  className="w-full h-16 p-2 text-sm bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none placeholder:text-muted-foreground transition-all duration-200 focus:scale-[1.02]"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-4 border-t border-border animate-in slide-in-from-bottom-2 duration-1200">
            <Button
              onClick={handleConfirmPaymentClick}
              disabled={isPlacingOrder}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPlacingOrder ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses Pesanan...
                </div>
              ) : (
                "Konfirmasi Pembayaran"
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Confirm Clear All Dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleConfirmClear}
        title="Hapus Semua Item?"
        description="Apakah Anda yakin ingin menghapus semua item dari keranjang? Tindakan ini tidak dapat dibatalkan dan Anda perlu menambahkan item lagi."
        confirmText="Ya, Hapus Semua"
        cancelText="Simpan Item"
        variant="destructive"
      />
    </>
  );
};

export default CartSidebar;