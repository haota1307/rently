import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "./signature-pad";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    signatureDataUrl: string,
    info: {
      identityCard: string;
      identityCardIssuedDate: string;
      identityCardIssuedPlace: string;
      address: string;
    }
  ) => void;
  title?: string;
  description?: string;
}

export function SignatureModal({
  isOpen,
  onClose,
  onSave,
  title = "Ký hợp đồng",
  description = "Vui lòng ký tên của bạn để xác nhận hợp đồng",
}: SignatureModalProps) {
  const [identityCard, setIdentityCard] = useState("");
  const [identityCardIssuedDate, setIdentityCardIssuedDate] = useState("");
  const [identityCardIssuedPlace, setIdentityCardIssuedPlace] = useState("");
  const [address, setAddress] = useState("");

  const handleSave = (signatureDataUrl: string) => {
    onSave(signatureDataUrl, {
      identityCard,
      identityCardIssuedDate,
      identityCardIssuedPlace,
      address,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mb-4">
          <Input
            placeholder="Số CCCD/CMND"
            value={identityCard}
            onChange={(e) => setIdentityCard(e.target.value)}
          />
          <Input
            placeholder="Ngày cấp (dd/mm/yyyy)"
            value={identityCardIssuedDate}
            onChange={(e) => setIdentityCardIssuedDate(e.target.value)}
          />
          <Input
            placeholder="Nơi cấp"
            value={identityCardIssuedPlace}
            onChange={(e) => setIdentityCardIssuedPlace(e.target.value)}
          />
          <Input
            placeholder="Địa chỉ thường trú"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
        <SignaturePad onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
