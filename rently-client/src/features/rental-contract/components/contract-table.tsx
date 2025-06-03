import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "./contract-status-badge";
import { formatDate } from "@/lib/format";
import { formatPrice } from "@/lib/utils";
import { ContractStatus } from "../contract.constants";
import { Eye, FileText, RotateCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, isPast, isFuture } from "date-fns";

export interface Contract {
  id: number;
  contractNumber: string;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  status: ContractStatus;
  landlord: {
    name: string;
    id: number;
  };
  tenant: {
    name: string;
    id: number;
  };
  room: {
    title: string;
    id: number;
  };
}

interface ContractTableProps {
  contracts: Contract[];
  loading: boolean;
  currentUserId?: number;
  onRefresh: () => void;
}

export function ContractTable({
  contracts,
  loading,
  currentUserId,
  onRefresh,
}: ContractTableProps) {
  const router = useRouter();

  const handleViewContract = (id: number) => {
    router.push(`/cho-thue/hop-dong/${id}`);
  };

  const getDaysRemaining = (endDate: Date) => {
    const today = new Date();
    const end = new Date(endDate);

    if (isPast(end)) return null;

    return differenceInDays(end, today);
  };

  const getExpirationBadge = (endDate: Date, status: ContractStatus) => {
    if (status !== ContractStatus.ACTIVE) return null;

    const daysRemaining = getDaysRemaining(endDate);
    if (daysRemaining === null) return null;

    if (daysRemaining <= 7) {
      return (
        <Badge variant="destructive" className="ml-2">
          Sắp hết hạn ({daysRemaining} ngày)
        </Badge>
      );
    } else if (daysRemaining <= 30) {
      return (
        <Badge variant="warning" className="ml-2 bg-yellow-500">
          {daysRemaining} ngày
        </Badge>
      );
    }

    return null;
  };

  if (loading) {
    return <ContractTableSkeleton />;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã hợp đồng</TableHead>
            <TableHead>Phòng</TableHead>
            <TableHead>Người thuê</TableHead>
            <TableHead>Thời hạn</TableHead>
            <TableHead>Giá thuê</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Không có hợp đồng nào
              </TableCell>
            </TableRow>
          ) : (
            contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell className="font-medium">
                  {contract.contractNumber}
                </TableCell>
                <TableCell>{contract.room.title}</TableCell>
                <TableCell>{contract.tenant.name}</TableCell>
                <TableCell>
                  <div>
                    <div>
                      {formatDate(contract.startDate)} -{" "}
                      {formatDate(contract.endDate)}
                    </div>
                    {getExpirationBadge(contract.endDate, contract.status)}
                  </div>
                </TableCell>
                <TableCell>{formatPrice(contract.monthlyRent)}</TableCell>
                <TableCell>
                  <ContractStatusBadge status={contract.status} />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewContract(contract.id)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Xem chi tiết
                      </DropdownMenuItem>

                      {/* Các tùy chọn nhanh cho hợp đồng đang hoạt động */}
                      {contract.status === ContractStatus.ACTIVE &&
                        currentUserId === contract.landlord.id && (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/cho-thue/hop-dong/${contract.id}?action=renew`
                                )
                              }
                            >
                              <RotateCw className="mr-2 h-4 w-4" />
                              Gia hạn hợp đồng
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/cho-thue/hop-dong/${contract.id}?action=terminate`
                                )
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Chấm dứt hợp đồng
                            </DropdownMenuItem>
                          </>
                        )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function ContractTableSkeleton() {
  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã hợp đồng</TableHead>
            <TableHead>Phòng</TableHead>
            <TableHead>Người thuê</TableHead>
            <TableHead>Thời hạn</TableHead>
            <TableHead>Giá thuê</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 7 }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
