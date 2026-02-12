import { AlertTriangle, X } from "lucide-react";
import { Button } from "./ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
}

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Yes",
  cancelText = "Cancel",
  variant = "default"
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/60 to-black/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      >
        {/* Dialog */}
        <div 
          className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md mx-auto transform animate-in zoom-in-95 slide-in-from-bottom-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                variant === "destructive" 
                  ? "bg-gradient-to-br from-red-50 to-red-100 text-red-600 shadow-red-200/50" 
                  : "bg-gradient-to-br from-primary/10 to-primary/20 text-primary shadow-primary/20"
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  This action requires confirmation
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="bg-muted/30 rounded-lg p-4 mb-6">
              <p className="text-foreground leading-relaxed">
                {description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 hover:bg-muted border-2 transition-all duration-200 hover:scale-105"
              >
                {cancelText}
              </Button>
              <Button
                onClick={handleConfirm}
                className={`px-6 transition-all duration-200 hover:scale-105 shadow-lg ${
                  variant === "destructive"
                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-red-500/25"
                    : "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-primary/25"
                }`}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;