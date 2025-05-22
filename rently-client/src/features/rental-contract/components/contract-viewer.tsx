import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import contractApiRequest from "../contract.api";
import { toast } from "sonner";

interface ContractViewerProps {
  contractId: number;
  contractNumber: string;
}

/**
 * Component hiển thị và tải xuống hợp đồng
 */
export const ContractViewer: React.FC<ContractViewerProps> = ({
  contractId,
  contractNumber,
}) => {
  const [isLoading, setIsLoading] = useState(false);

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
      <Button onClick={handleDownload} disabled={isLoading} className="w-fit">
        <Download className="mr-2 h-4 w-4" />
        {isLoading ? "Đang tải xuống..." : "Tải xuống hợp đồng"}
      </Button>
    </div>
  );
};

export default ContractViewer;
