import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignatureModal } from "./signature-modal";
import contractApiRequest from "../contract.api";
import { toast } from "sonner";
import { ContractStatus } from "../contract.constants";

interface SignContractButtonProps {
  contractId: number;
  status: ContractStatus;
  userRole: "tenant" | "landlord";
  onSuccess: () => void;
  disabled?: boolean;
}

export function SignContractButton({
  contractId,
  status,
  userRole,
  onSuccess,
  disabled = false,
}: SignContractButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Kiểm tra xem người dùng có quyền ký không
  const canSign =
    (userRole === "landlord" &&
      status === ContractStatus.AWAITING_LANDLORD_SIGNATURE) ||
    (userRole === "tenant" &&
      status === ContractStatus.AWAITING_TENANT_SIGNATURE);

  const handleSign = async (
    signatureDataUrl: string,
    info: {
      identityCard: string;
      identityCardIssuedDate: string;
      identityCardIssuedPlace: string;
      address: string;
    }
  ) => {
    try {
      setIsLoading(true);
      await contractApiRequest.sign(contractId, {
        signature: signatureDataUrl,
        ...info,
      });
      toast.success("Đã ký hợp đồng thành công");
      onSuccess();
    } catch (error: any) {
      console.error("Lỗi khi ký hợp đồng:", error);
      toast.error(error?.payload?.message || "Có lỗi xảy ra khi ký hợp đồng");
    } finally {
      setIsLoading(false);
    }
  };

  if (!canSign) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        disabled={disabled || isLoading}
      >
        {isLoading ? "Đang xử lý..." : "Ký hợp đồng"}
      </Button>

      <SignatureModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSign}
      />
    </>
  );
}
