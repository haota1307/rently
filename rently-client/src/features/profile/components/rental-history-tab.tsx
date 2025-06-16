"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  AlertCircle,
  Eye,
  FileText,
  Loader2,
  Download,
  Receipt,
} from "lucide-react";
import { useGetTenantRentalRequests } from "@/features/rental-request";
import {
  RentalRequestStatus,
  RentalRequestType,
} from "@/schemas/rental-request.schema";
import { Button } from "@/components/ui/button";
import contractApiRequest from "@/features/rental-contract/contract.api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ContractStatus,
  CONTRACT_STATUS_LABELS,
} from "@/features/rental-contract/contract.constants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { SignContractButton } from "@/features/rental-contract/components/sign-contract-button";
import { useGetTenantRoomBills } from "@/features/rooms/useRoomBill";
import { RoomBillDetailModal } from "@/features/rooms/components/room-bill-detail-modal";
import { RoomBillType } from "@/schemas/room-bill.schema";

// Xác định kiểu dữ liệu cho tệp đính kèm
interface ContractAttachment {
  id: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: number;
  createdAt: Date;
}

// Xác định kiểu dữ liệu cho contract
interface ContractDetailType {
  id: number;
  contractNumber: string;
  rentalRequestId: number;
  roomId: number;
  landlordId: number;
  tenantId: number;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  paymentDueDate: number;
  contractContent: string;
  terms: Record<string, any> | null;
  landlordSignedAt: Date | null;
  tenantSignedAt: Date | null;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
  finalDocumentUrl: string | null;
  landlord: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  tenant: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  room: {
    id: number;
    title: string;
    price: number;
    area: number;
  };
  rentalRequest: {
    id: number;
    postId: number;
    status: string;
  };
  attachments: ContractAttachment[];
  template: {
    id: number;
    name: string;
    fileUrl: string;
  } | null;
}

export function RentalHistoryTab() {
  const { userId } = useAuth();
  const [selectedContract, setSelectedContract] = useState<number | null>(null);
  const [isContractDialogOpen, setIsContractDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [isBillsDialogOpen, setIsBillsDialogOpen] = useState(false);
  const [selectedBillId, setSelectedBillId] = useState<number | null>(null);
  const [isBillDetailOpen, setIsBillDetailOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: rentalRequestsResponse,
    isLoading,
    error,
  } = useGetTenantRentalRequests({
    limit: 10,
    page: 1,
  });

  // Kiểm tra cấu trúc dữ liệu - API trả về trực tiếp data, không có payload
  const rentalRequests: RentalRequestType[] =
    rentalRequestsResponse?.data || [];

  // Lấy danh sách hóa đơn cho phòng được chọn
  const { data: roomBillsData, isLoading: isBillsLoading } =
    useGetTenantRoomBills({
      roomId: selectedRoomId || undefined,
      page: 1,
      limit: 50,
    });

  // Truy vấn hợp đồng khi chọn một phòng đã thuê
  const {
    data: contractDetail,
    isLoading: isContractLoading,
    error: contractError,
  } = useQuery({
    queryKey: ["contract-detail", selectedContract],
    queryFn: () => {
      if (!selectedContract) return null;
      return contractApiRequest
        .detail(selectedContract)
        .then((res) => res.payload); // Sửa .data thành .payload
    },
    enabled: !!selectedContract,
  });

  const handleViewContract = async (rentalRequestId: number) => {
    try {
      // Truy vấn danh sách hợp đồng của người dùng để tìm hợp đồng tương ứng với yêu cầu thuê
      const response = await contractApiRequest.list();
      const contracts = response.payload.data; // Sửa .data.data thành .payload.data

      // Tìm hợp đồng cho yêu cầu thuê cụ thể
      const contract = contracts.find(
        (c: ContractDetailType) => c.rentalRequestId === rentalRequestId // Thêm kiểu dữ liệu cho c
      );

      if (!contract) {
        toast.error("Không tìm thấy hợp đồng cho phòng này");
        return;
      }

      // Lưu ID hợp đồng và mở dialog
      setSelectedContract(contract.id);
      setIsContractDialogOpen(true);
    } catch (error) {
      console.error("Lỗi khi tìm hợp đồng:", error);
      toast.error("Đã xảy ra lỗi khi tải thông tin hợp đồng");
    }
  };

  const handleDownloadContract = async () => {
    if (!selectedContract) return;

    setIsDownloading(true);
    try {
      const blob =
        await contractApiRequest.downloadFinalDocument(selectedContract);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contract-${selectedContract}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Tải hợp đồng thành công");
    } catch (error) {
      console.error("Lỗi khi tải hợp đồng:", error);
      toast.error("Đã xảy ra lỗi khi tải hợp đồng");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewBills = (roomId: number | undefined) => {
    if (!roomId) return;
    setSelectedRoomId(roomId);
    setIsBillsDialogOpen(true);
  };

  const handleViewBillDetail = (billId: number) => {
    setSelectedBillId(billId);
    setIsBillDetailOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="text-xl">Lịch sử thuê phòng</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error("Error loading rental requests:", error);
    return (
      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="text-xl">Lịch sử thuê phòng</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Đã xảy ra lỗi khi tải lịch sử thuê phòng.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!rentalRequestsResponse) {
    console.log("Không có dữ liệu phản hồi từ API");
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b bg-muted/40">
          <CardTitle className="text-xl">Lịch sử thuê phòng</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!rentalRequests || rentalRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Bạn chưa có lịch sử thuê phòng nào.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phòng trọ</TableHead>
                  <TableHead>Ngày dự kiến thuê</TableHead>
                  <TableHead>Thời hạn thuê</TableHead>
                  <TableHead>Tiền cọc</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentalRequests.map((rental: RentalRequestType) => (
                  <TableRow key={rental.id}>
                    <TableCell className="font-medium">
                      {rental.post.title}
                    </TableCell>
                    <TableCell>
                      {format(new Date(rental.expectedMoveDate), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell>{rental.duration} tháng</TableCell>
                    <TableCell>
                      {rental.depositAmount
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(rental.depositAmount)
                        : "Chưa đặt cọc"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rental.status === RentalRequestStatus.APPROVED
                            ? "default"
                            : rental.status === RentalRequestStatus.CANCELED
                              ? "destructive"
                              : rental.status === RentalRequestStatus.REJECTED
                                ? "outline"
                                : "secondary"
                        }
                      >
                        {rental.status === RentalRequestStatus.APPROVED
                          ? "Đã thuê"
                          : rental.status === RentalRequestStatus.PENDING
                            ? "Đang chờ"
                            : rental.status === RentalRequestStatus.REJECTED
                              ? "Bị từ chối"
                              : "Đã hủy"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {rental.status === RentalRequestStatus.APPROVED && (
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewContract(rental.id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Hợp đồng
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleViewBills(rental.post.room?.id)
                            }
                            disabled={!rental.post.room?.id}
                          >
                            <Receipt className="mr-2 h-4 w-4" />
                            Hóa đơn
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isContractDialogOpen}
        onOpenChange={setIsContractDialogOpen}
      >
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết hợp đồng thuê phòng</DialogTitle>
          </DialogHeader>

          {isContractLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : contractError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Lỗi</AlertTitle>
              <AlertDescription>
                Không thể tải thông tin hợp đồng. Vui lòng thử lại sau.
              </AlertDescription>
            </Alert>
          ) : contractDetail ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Số hợp đồng
                  </h3>
                  <p>{contractDetail.contractNumber}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Trạng thái
                  </h3>
                  <Badge
                    variant={
                      contractDetail.status === ContractStatus.ACTIVE
                        ? "default"
                        : contractDetail.status ===
                              ContractStatus.AWAITING_TENANT_SIGNATURE ||
                            contractDetail.status ===
                              ContractStatus.AWAITING_LANDLORD_SIGNATURE
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {CONTRACT_STATUS_LABELS[contractDetail.status]}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Ngày bắt đầu
                  </h3>
                  <p>
                    {format(new Date(contractDetail.startDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Ngày kết thúc
                  </h3>
                  <p>
                    {format(new Date(contractDetail.endDate), "dd/MM/yyyy", {
                      locale: vi,
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Giá thuê hàng tháng
                  </h3>
                  <p>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(contractDetail.monthlyRent)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Tiền đặt cọc
                  </h3>
                  <p>
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(contractDetail.deposit)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Ngày thanh toán hàng tháng
                  </h3>
                  <p>Ngày {contractDetail.paymentDueDate}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground">
                    Tình trạng ký
                  </h3>
                  <p>
                    {contractDetail.landlordSignedAt ? (
                      <span className="text-green-600">Chủ nhà đã ký • </span>
                    ) : (
                      <span className="text-yellow-600">
                        Chủ nhà chưa ký •{" "}
                      </span>
                    )}
                    {contractDetail.tenantSignedAt ? (
                      <span className="text-green-600">Người thuê đã ký</span>
                    ) : (
                      <span className="text-yellow-600">
                        Người thuê chưa ký
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Thông tin phòng</h3>
                <p>{contractDetail.room.title}</p>
                <p className="text-sm text-muted-foreground">
                  Diện tích: {contractDetail.room.area} m² • Giá niêm yết:{" "}
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(contractDetail.room.price)}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Thông tin bên cho thuê</h3>
                <p>{contractDetail.landlord.name}</p>
                <p className="text-sm text-muted-foreground">
                  {contractDetail.landlord.email} •{" "}
                  {contractDetail.landlord.phoneNumber || "Chưa cập nhật SĐT"}
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Tệp đính kèm</h3>
                {contractDetail.attachments &&
                contractDetail.attachments.length > 0 ? (
                  <ul className="space-y-2">
                    {contractDetail.attachments.map(
                      (attachment: ContractAttachment) => (
                        <li key={attachment.id} className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-blue-500" />
                          <a
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {attachment.fileName}
                          </a>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Không có tệp đính kèm
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                {contractDetail.finalDocumentUrl && (
                  <Button
                    variant="default"
                    onClick={handleDownloadContract}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    Tải hợp đồng (PDF)
                  </Button>
                )}
              </div>

              {contractDetail && userId === contractDetail.tenantId && (
                <div className="mt-4">
                  <SignContractButton
                    contractId={contractDetail.id}
                    status={contractDetail.status}
                    userRole="tenant"
                    onSuccess={() => {
                      // Sau khi ký, refetch lại contract detail và danh sách hợp đồng
                      setSelectedContract(contractDetail.id);
                      queryClient.invalidateQueries({
                        queryKey: ["contract-detail", contractDetail.id],
                      });
                      queryClient.invalidateQueries({
                        queryKey: ["contracts"],
                      });
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Thông báo</AlertTitle>
              <AlertDescription>
                Không tìm thấy thông tin hợp đồng cho phòng này.
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog hiển thị danh sách hóa đơn */}
      <Dialog open={isBillsDialogOpen} onOpenChange={setIsBillsDialogOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Danh sách hóa đơn phòng trọ</DialogTitle>
          </DialogHeader>

          {isBillsLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : roomBillsData?.data && roomBillsData.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kỳ hóa đơn</TableHead>
                  <TableHead>Điện</TableHead>
                  <TableHead>Nước</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Hạn thanh toán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomBillsData.data.map((bill: RoomBillType) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">
                      {format(new Date(bill.billingMonth), "MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      {bill.electricityNew - bill.electricityOld} kWh
                      <div className="text-sm text-muted-foreground">
                        {(
                          (bill.electricityNew - bill.electricityOld) *
                          bill.electricityPrice
                        ).toLocaleString()}{" "}
                        đ
                      </div>
                    </TableCell>
                    <TableCell>
                      {bill.waterNew - bill.waterOld} m³
                      <div className="text-sm text-muted-foreground">
                        {(
                          (bill.waterNew - bill.waterOld) *
                          bill.waterPrice
                        ).toLocaleString()}{" "}
                        đ
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {bill.totalAmount.toLocaleString()} đ
                    </TableCell>
                    <TableCell>
                      {format(new Date(bill.dueDate), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bill.isPaid ? "default" : "destructive"}>
                        {bill.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewBillDetail(bill.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Chưa có hóa đơn</AlertTitle>
              <AlertDescription>
                Phòng này chưa có hóa đơn nào được tạo.
              </AlertDescription>
            </Alert>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal chi tiết hóa đơn */}
      {selectedBillId && (
        <RoomBillDetailModal
          open={isBillDetailOpen}
          onOpenChange={setIsBillDetailOpen}
          billId={selectedBillId}
          hideActions={true}
        />
      )}
    </>
  );
}
