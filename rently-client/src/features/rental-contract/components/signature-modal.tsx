import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignaturePad } from "./signature-pad";

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
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
  const handleSave = (signatureDataUrl: string) => {
    onSave(signatureDataUrl);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SignaturePad onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
}
