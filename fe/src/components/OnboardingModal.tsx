import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { CheckCircle } from "lucide-react";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({
  isOpen,
  onClose,
}: OnboardingModalProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(isOpen);

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  const handleCompleteLater = () => {
    setOpen(false);
    onClose();
  };

  const handleCompleteNow = () => {
    setOpen(false);
    onClose();
    navigate("/settings");
  };

  return (
    <Dialog open={open} onOpenChange={handleCompleteLater}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Welcome to Edin Delivery!
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Your account has been created successfully.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-center text-gray-700">
            Complete your profile information to get personalized recommendations and faster checkout.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              You need to add:
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                Full Name
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-600 rounded-full"></span>
                Delivery Address
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleCompleteLater}
              className="flex-1 font-medium py-2.5"
            >
              Complete Later
            </Button>
            <Button
              onClick={handleCompleteNow}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2.5"
            >
              Lengkapi Sekarang
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
