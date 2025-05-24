"use client";

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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CalendarDays, Building, MapPin } from "lucide-react";

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
      <DialogContent className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl flex items-center justify-center text-center">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="space-y-6 overflow-y-auto pr-1 max-h-[calc(90vh-180px)]">
          <div>
            <h3 className="text-sm font-medium mb-3">Thông tin cá nhân</h3>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label
                  htmlFor="identityCard"
                  className="text-sm flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Số CCCD/CMND
                </Label>
                <Input
                  id="identityCard"
                  placeholder="Nhập số CCCD/CMND"
                  value={identityCard}
                  onChange={(e) => setIdentityCard(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-offset-0 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label
                    htmlFor="issuedDate"
                    className="text-sm flex items-center gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Ngày cấp
                  </Label>
                  <Input
                    id="issuedDate"
                    placeholder="dd/mm/yyyy"
                    value={identityCardIssuedDate}
                    onChange={(e) => setIdentityCardIssuedDate(e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-offset-0 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="issuedPlace"
                    className="text-sm flex items-center gap-2"
                  >
                    <Building className="h-4 w-4" />
                    Nơi cấp
                  </Label>
                  <Input
                    id="issuedPlace"
                    placeholder="Nhập nơi cấp"
                    value={identityCardIssuedPlace}
                    onChange={(e) => setIdentityCardIssuedPlace(e.target.value)}
                    className="transition-all duration-200 focus:ring-2 focus:ring-offset-0 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-sm flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  Địa chỉ thường trú
                </Label>
                <Input
                  id="address"
                  placeholder="Nhập địa chỉ thường trú"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-offset-0 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-3">Ký tên xác nhận</h3>
            <div className="border border-input rounded-md p-1 bg-muted/30">
              <SignaturePad onSave={handleSave} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
