import { Button } from "@/components/ui/button";
import { ContractStatusBadge } from "./contract-status-badge";
import { formatDate } from "@/lib/format";
import { formatPrice } from "@/lib/utils";
import { ContractStatus } from "../contract.constants";
import { Eye, FileText, Pencil, Trash2 } from "lucide-react";
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
  };
  tenant: {
    name: string;
  };
  room: {
    title: string;
  };
}

interface ContractTableProps {
  contracts: Contract[];
  loading: boolean;
  onRefresh: () => void;
}

export function ContractTable({
  contracts,
  loading,
  onRefresh,
}: ContractTableProps) {
  const router = useRouter();

  const handleViewContract = (id: number) => {
    router.push(`/cho-thue/hop-dong/${id}`);
  };

  const handleExportContract = (id: number) => {
    // Xử lý xuất hợp đồng
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
                  {formatDate(contract.startDate)} -{" "}
                  {formatDate(contract.endDate)}
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
                      <DropdownMenuItem
                        onClick={() => handleExportContract(contract.id)}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Xuất PDF
                      </DropdownMenuItem>
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
