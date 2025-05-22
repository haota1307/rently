"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/data-table";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  FileText,
  MoreHorizontal,
  Download,
  Pencil,
  X,
} from "lucide-react";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { CommonFilterLayout } from "@/features/dashboard/components/filters/common-filter-layout";
import {
  ContractStatus,
  CONTRACT_STATUS_LABELS,
} from "@/features/rental-contract/contract.constants";
import contractApiRequest from "@/features/rental-contract/contract.api";
import { Contract } from "@/features/rental-contract/components/contract-table";
import { CreateContractButton } from "@/features/rental-contract/components/create-contract-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ContractPage() {
  const { userId } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ContractStatus | "all">(
    "all"
  );
  const [searchInput, setSearchInput] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  // State for selected contract
  const [selectedContract, setSelectedContract] = useState<Contract | null>(
    null
  );

  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    if (userId) {
      fetchContracts();
    }
  }, [userId, selectedStatus, debouncedSearch, page, timeFilter]);

  const fetchContracts = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const response = await contractApiRequest.list({
        status:
          selectedStatus !== "all"
            ? (selectedStatus as ContractStatus)
            : undefined,
        search: debouncedSearch || undefined,
        page,
        limit,
      });

      setContracts(response.payload.data as Contract[]);
    } catch (error) {
      console.error("Lỗi khi tải hợp đồng:", error);
      toast.error("Không thể tải danh sách hợp đồng");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    setPage(1);
    setSelectedStatus(status as ContractStatus | "all");
  };

  const handleTimeFilterChange = (time: string) => {
    setPage(1);
    setTimeFilter(time);
  };

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSelectedStatus("all");
    setTimeFilter("all");
    setSearchInput("");
    setPage(1);
  };

  const handleViewContract = (contract: Contract) => {
    router.push(`/cho-thue/hop-dong/${contract.id}`);
  };

  // Import và sử dụng ContractViewer component để xử lý tải xuống
  const handleExportContract = async (contract: Contract) => {
    // Gọi API để xuất hợp đồng dạng PDF trực tiếp sử dụng ContractViewer component
    const toastId = toast.loading("Đang xử lý hợp đồng...");

    try {
      // Gọi API để xuất hợp đồng dạng PDF
      const pdfBlob = await contractApiRequest.exportPDF(contract.id);

      // Tạo URL tạm thời từ blob để tải xuống
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Tạo một element a ẩn để tải xuống
      const downloadLink = document.createElement("a");
      downloadLink.href = blobUrl;
      downloadLink.download = `hop-dong-${contract.contractNumber}.pdf`;
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
    }
  };

  const contractColumns = [
    {
      id: "contractNumber",
      header: "Mã hợp đồng",
      cell: ({ row }: { row: { original: Contract } }) => (
        <div className="font-medium">{row.original.contractNumber}</div>
      ),
    },
    {
      id: "room",
      header: "Phòng",
      cell: ({ row }: { row: { original: Contract } }) =>
        row.original.room.title,
    },
    {
      id: "tenant",
      header: "Người thuê",
      cell: ({ row }: { row: { original: Contract } }) =>
        row.original.tenant.name,
    },
    {
      id: "period",
      header: "Thời hạn",
      cell: ({ row }: { row: { original: Contract } }) => {
        const startDate = new Date(row.original.startDate);
        const endDate = new Date(row.original.endDate);
        return `${startDate.toLocaleDateString("vi-VN")} - ${endDate.toLocaleDateString("vi-VN")}`;
      },
    },
    {
      id: "rent",
      header: "Giá thuê",
      cell: ({ row }: { row: { original: Contract } }) => {
        const adjustedPrice = row.original.monthlyRent * 1000;

        return new Intl.NumberFormat("vi-VN", {
          style: "currency",
          currency: "VND",
        }).format(adjustedPrice);
      },
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: ({ row }: { row: { original: Contract } }) => {
        const contract = row.original;
        return (
          <div
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium
            ${
              contract.status === ContractStatus.ACTIVE
                ? "bg-green-100 text-green-800"
                : contract.status === ContractStatus.DRAFT
                  ? "bg-gray-100 text-gray-800"
                  : contract.status ===
                        ContractStatus.AWAITING_LANDLORD_SIGNATURE ||
                      contract.status ===
                        ContractStatus.AWAITING_TENANT_SIGNATURE
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
            }`}
          >
            {CONTRACT_STATUS_LABELS[contract.status]}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Hành động",
      cell: ({ row }: { row: { original: Contract } }) => {
        const contract = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Mở menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Hành động</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  navigator.clipboard.writeText(contract.id.toString())
                }
              >
                Sao chép ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                <Eye className="mr-2 h-4 w-4" />
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportContract(contract)}>
                <Download className="mr-2 h-4 w-4" />
                Xuất PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Quản lý hợp đồng</h1>
      </header>

      <div className="flex flex-col justify-between m-4 gap-4">
        <CommonFilterLayout
          searchInput={searchInput}
          onSearchChange={handleSearchChange}
          clearAllFilters={handleClearAllFilters}
          showClearButton={
            selectedStatus !== "all" ||
            timeFilter !== "all" ||
            searchInput.trim() !== ""
          }
          searchPlaceholder="Tìm kiếm theo mã hợp đồng, người thuê..."
          actionButton={<CreateContractButton />}
          filterControls={
            <>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value={ContractStatus.DRAFT}>Bản nháp</SelectItem>
                  <SelectItem value={ContractStatus.AWAITING_TENANT_SIGNATURE}>
                    Chờ người thuê ký
                  </SelectItem>
                  <SelectItem value={ContractStatus.ACTIVE}>
                    Đang hiệu lực
                  </SelectItem>
                  <SelectItem value={ContractStatus.EXPIRED}>
                    Hết hạn
                  </SelectItem>
                  <SelectItem value={ContractStatus.TERMINATED}>
                    Đã chấm dứt
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Thời gian" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thời gian</SelectItem>
                  <SelectItem value="week">Tuần này</SelectItem>
                  <SelectItem value="month">Tháng này</SelectItem>
                  <SelectItem value="year">Năm nay</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
        />

        <DataTable
          columns={contractColumns}
          data={contracts}
          currentPage={page}
          totalPages={Math.ceil(contracts.length / limit)}
          onPageChange={setPage}
          isLoading={loading}
          emptyMessage="Không có hợp đồng nào"
        />
      </div>
    </SidebarInset>
  );
}
