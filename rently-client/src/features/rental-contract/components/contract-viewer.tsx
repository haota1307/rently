import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import contractApiRequest from "../contract.api";
import { toast } from "sonner";
import { ContractStatus } from "../contract.constants";
import { SignContractButton } from "./sign-contract-button";
import { useAuth } from "@/hooks/use-auth";

interface ContractViewerProps {
  contractId: number;
  contractNumber: string;
  status: ContractStatus;
  landlordId: number;
  tenantId: number;
  onContractUpdated?: () => void;
}

/**
 * Component hiển thị và tải xuống hợp đồng, cho phép ký hợp đồng
 */
export const ContractViewer: React.FC<ContractViewerProps> = ({
  contractId,
  contractNumber,
  status,
  landlordId,
  tenantId,
  onContractUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { userId } = useAuth();

  // Xác định vai trò người dùng hiện tại
  const isLandlord = userId === landlordId;
  const isTenant = userId === tenantId;
  const userRole = isLandlord ? "landlord" : isTenant ? "tenant" : null;

  const handleDownload = async () => {
    const toastId = toast.loading("Đang xử lý hợp đồng...");
    setIsLoading(true);

    try {
      // Gọi API để xuất hợp đồng dạng PDF
      const pdfBlob = await contractApiRequest.exportPDF(contractId);

      // Tạo URL tạm thời từ blob để tải xuống
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Tạo một element a ẩn để tải xuống
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = `hop-dong-${contractNumber}.pdf`;
      document.body.appendChild(downloadLink);

      // Kích hoạt sự kiện click để tải xuống
      downloadLink.click();

      // Dọn dẹp
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);

      toast.dismiss(toastId);
      toast.success("Tải xuống hợp đồng thành công!");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Không thể tải xuống hợp đồng. Vui lòng thử lại sau.");
      console.error("Lỗi khi xuất PDF:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleDownload} disabled={isLoading} className="w-fit">
          <Download className="mr-2 h-4 w-4" />
          {isLoading ? "Đang tải xuống..." : "Tải xuống hợp đồng"}
        </Button>

        {userRole && (
          <SignContractButton
            contractId={contractId}
            status={status}
            userRole={userRole}
            onSuccess={onContractUpdated || (() => {})}
          />
        )}
      </div>
    </div>
  );
};

export default ContractViewer;
