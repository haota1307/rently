"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { ContractViewer } from "@/features/rental-contract/components/contract-viewer";
import { SignContractButton } from "@/features/rental-contract/components/sign-contract-button";
import { ContractActions } from "@/features/rental-contract/components/contract-actions";

// Đảm bảo trang này luôn được render động
export const dynamic = "force-dynamic";

export default function ContractDetailPage() {
  const router = useRouter();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const { userId } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    type: string;
  } | null>(null);

  // State để kiểm soát việc mở các modal tương ứng khi có action param
  const [openTerminateModal, setOpenTerminateModal] = useState(false);
  const [openRenewModal, setOpenRenewModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);

  // Xử lý action từ URL query params
  useEffect(() => {
    if (contract && action) {
      if (action === "terminate" && contract.status === ContractStatus.ACTIVE) {
        setOpenTerminateModal(true);
      } else if (
        action === "renew" &&
        contract.status === ContractStatus.ACTIVE
      ) {
        setOpenRenewModal(true);
      }

      // Xóa action param sau khi đã xử lý
      router.push(`/cho-thue/hop-dong/${id}`, { scroll: false });
    }
  }, [contract, action, id, router]);

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

  // Xác định vai trò người dùng với hợp đồng này
  const userRole =
    contract.landlordId === userId
      ? "landlord"
      : contract.tenantId === userId
        ? "tenant"
        : null;

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

            {/* Tích hợp ContractViewer */}
            <div className="mt-6">
              <ContractViewer
                contractId={Number(id)}
                contractNumber={contract.contractNumber}
                status={contract.status}
                landlordId={contract.landlordId}
                tenantId={contract.tenantId}
                onContractUpdated={fetchContractDetails}
              />
            </div>

            {/* Thêm Contract Actions */}
            <div className="mt-3">
              <ContractActions
                contractId={Number(id)}
                status={contract.status}
                endDate={new Date(contract.endDate)}
                isLandlord={contract.landlordId === userId}
                onContractUpdated={fetchContractDetails}
                openTerminateModal={openTerminateModal}
                setOpenTerminateModal={setOpenTerminateModal}
                openRenewModal={openRenewModal}
                setOpenRenewModal={setOpenRenewModal}
              />
            </div>

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
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <button
                            className="text-blue-600 hover:underline text-left"
                            style={{
                              cursor: "pointer",
                              background: "none",
                              border: "none",
                              padding: 0,
                            }}
                            onClick={() =>
                              setPreviewFile({
                                url: attachment.fileUrl,
                                type: attachment.fileType,
                              })
                            }
                          >
                            {attachment.fileName}
                          </button>
                        </div>
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                          download
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
            {/* Modal xem file đính kèm */}
            <Dialog
              open={!!previewFile}
              onOpenChange={() => setPreviewFile(null)}
            >
              <DialogContent className="max-w-3xl">
                {previewFile &&
                  (previewFile.type.includes("pdf") ? (
                    <iframe
                      src={previewFile.url}
                      title="Xem file PDF"
                      width="100%"
                      height="600px"
                      style={{ border: "none" }}
                    />
                  ) : previewFile.type.includes("image") ? (
                    <img
                      src={previewFile.url}
                      alt="Xem ảnh"
                      style={{ maxWidth: "100%", maxHeight: 500 }}
                    />
                  ) : (
                    <div>
                      <p>
                        Không hỗ trợ xem trực tiếp file này. Bạn có thể tải về
                        để xem.
                      </p>
                      <a
                        href={previewFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                        download
                      >
                        Tải file về
                      </a>
                    </div>
                  ))}
              </DialogContent>
            </Dialog>
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
                    {contract.monthlyRent.toLocaleString()} VNĐ
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tiền đặt cọc</p>
                  <p className="font-medium">
                    {contract.deposit.toLocaleString()} VNĐ
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
    </SidebarInset>
  );
}
