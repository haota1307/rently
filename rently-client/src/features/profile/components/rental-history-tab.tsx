"use client";

import React from "react";
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
import { Loader2 } from "lucide-react";
import { useGetTenantRentalRequests } from "@/features/rental-request";
import {
  RentalRequestStatus,
  RentalRequestType,
} from "@/schemas/rental-request.schema";

export function RentalHistoryTab() {
  const {
    data: rentalRequestsResponse,
    isLoading,
    error,
  } = useGetTenantRentalRequests({
    limit: 10,
    page: 1,
  });

  console.log("Rental requests response:", rentalRequestsResponse);

  // Kiểm tra cấu trúc dữ liệu - API trả về trực tiếp data, không có payload
  const rentalRequests: RentalRequestType[] =
    rentalRequestsResponse?.data || [];

  console.log("Processed rental requests:", rentalRequests);

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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
