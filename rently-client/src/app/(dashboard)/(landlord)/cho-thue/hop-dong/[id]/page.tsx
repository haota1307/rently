"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import contractApiRequest from "@/features/rental-contract/contract.api";
import { ContractStatusBadge } from "@/features/rental-contract/components/contract-status-badge";
import { ContractStatus } from "@/features/rental-contract/contract.constants";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/format";
import { formatPrice } from "@/lib/utils";
import { FileText, Upload, Download, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default function ContractDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const { userId } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [signDialogOpen, setSignDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const response = await contractApiRequest.detail(Number(id));
      setContract(response.payload);
    } catch (error) {
      console.error("Lỗi khi tải thông tin hợp đồng:", error);
      toast.error("Không thể tải thông tin hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    try {
      // Giả lập dữ liệu chữ ký (trong thực tế sẽ lấy từ canvas hoặc input)
      const signatureData = {
        signature:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
      };

      await contractApiRequest.sign(Number(id), signatureData);
      toast.success("Ký hợp đồng thành công");
      fetchContractDetails();
      setSignDialogOpen(false);
    } catch (error) {
      console.error("Lỗi khi ký hợp đồng:", error);
      toast.error("Không thể ký hợp đồng");
    }
  };

  const handleDownloadContract = async () => {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", `/api/rental-contract/${id}/final-document`, true);
      xhr.responseType = "blob";

      xhr.onload = function () {
        if (this.status === 200) {
          const blob = new Blob([this.response], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `hop-dong-${id}.pdf`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);
        } else {
          toast.error("Không thể tải xuống hợp đồng");
        }
      };

      xhr.onerror = function () {
        toast.error("Không thể tải xuống hợp đồng");
      };

      xhr.send();
    } catch (error) {
      console.error("Lỗi khi tải xuống hợp đồng:", error);
      toast.error("Không thể tải xuống hợp đồng");
    }
  };

  const handleUploadAttachment = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    try {
      await contractApiRequest.addAttachment(Number(id), file);
      toast.success("Thêm tệp đính kèm thành công");
      fetchContractDetails();
    } catch (error) {
      console.error("Lỗi khi thêm tệp đính kèm:", error);
      toast.error("Không thể thêm tệp đính kèm");
    }
  };

  if (loading) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Chi tiết hợp đồng</h1>
        </header>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Đang tải thông tin hợp đồng...</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (!contract) {
    return (
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Chi tiết hợp đồng</h1>
        </header>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold mb-2">Không tìm thấy hợp đồng</h2>
            <p className="text-muted-foreground mb-4">
              Hợp đồng không tồn tại hoặc bạn không có quyền truy cập
            </p>
            <Button onClick={() => router.push("/cho-thue/hop-dong")}>
              Quay lại danh sách
            </Button>
          </div>
        </div>
      </SidebarInset>
    );
  }

  const canSign =
    contract.status === ContractStatus.AWAITING_LANDLORD_SIGNATURE &&
    contract.landlordId === userId &&
    !contract.landlordSignedAt;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Chi tiết hợp đồng</h1>
        <div className="ml-2">
          <ContractStatusBadge status={contract.status} />
        </div>
      </header>

      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/cho-thue/hop-dong")}
              className="mr-4"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Quay lại
            </Button>
            <h2 className="text-xl font-bold">
              Hợp đồng #{contract.contractNumber}
            </h2>
          </div>
          <div className="flex gap-2">
            {canSign && (
              <Button onClick={() => setSignDialogOpen(true)}>
                Ký hợp đồng
              </Button>
            )}
            {contract.status === ContractStatus.ACTIVE && (
              <Button variant="outline" onClick={handleDownloadContract}>
                <Download className="mr-2 h-4 w-4" />
                Tải xuống hợp đồng
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Nội dung hợp đồng */}
            <Card>
              <CardHeader>
                <CardTitle>Nội dung hợp đồng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {contract.contractContent ? (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: contract.contractContent,
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Không có nội dung hợp đồng
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File đính kèm */}
            <Card className="mt-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Tệp đính kèm</CardTitle>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    asChild
                  >
                    <label>
                      <Upload className="mr-2 h-4 w-4" />
                      <span>Tải lên</span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleUploadAttachment}
                      />
                    </label>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {contract.attachments && contract.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {contract.attachments.map((attachment: any) => (
                      <li
                        key={attachment.id}
                        className="flex items-center justify-between border p-3 rounded-md"
                      >
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-600" />
                          <span>{attachment.fileName}</span>
                        </div>
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Chưa có tệp đính kèm
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Thông tin hợp đồng */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin hợp đồng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Phòng</p>
                  <p className="font-medium">{contract.room?.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Người thuê</p>
                  <p className="font-medium">{contract.tenant?.name}</p>
                  <p className="text-sm">{contract.tenant?.email}</p>
                  {contract.tenant?.phoneNumber && (
                    <p className="text-sm">{contract.tenant?.phoneNumber}</p>
                  )}
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Thời hạn</p>
                  <p className="font-medium">
                    {formatDate(new Date(contract.startDate))} -{" "}
                    {formatDate(new Date(contract.endDate))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Giá thuê hàng tháng
                  </p>
                  <p className="font-medium">
                    {(contract.monthlyRent * 1000).toLocaleString()} đ
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tiền đặt cọc</p>
                  <p className="font-medium">
                    {(contract.deposit * 1000).toLocaleString()} đ
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Ngày thanh toán hàng tháng
                  </p>
                  <p className="font-medium">Ngày {contract.paymentDueDate}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Ngày tạo hợp đồng
                  </p>
                  <p className="font-medium">
                    {formatDate(new Date(contract.createdAt))}
                  </p>
                </div>
                {contract.landlordSignedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Chủ nhà ký</p>
                    <p className="font-medium">
                      {formatDate(new Date(contract.landlordSignedAt))}
                    </p>
                  </div>
                )}
                {contract.tenantSignedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Người thuê ký
                    </p>
                    <p className="font-medium">
                      {formatDate(new Date(contract.tenantSignedAt))}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialog ký hợp đồng */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ký hợp đồng</DialogTitle>
            <DialogDescription>
              Bằng cách nhấn nút "Xác nhận", bạn đồng ý với các điều khoản trong
              hợp đồng này.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Hợp đồng: <strong>{contract.contractNumber}</strong>
            </p>
            <p className="mb-4">
              Ngày ký:{" "}
              <strong>
                {format(new Date(), "dd/MM/yyyy", { locale: vi })}
              </strong>
            </p>
            {/* Mô phỏng vùng ký tên */}
            <div className="border border-dashed rounded-md p-4 text-center">
              <p className="text-muted-foreground mb-2">
                Chữ ký của bạn sẽ được lưu trực tuyến
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSignContract}>Xác nhận</Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  );
}
