import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  RotateCw,
  XCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import contractApiRequest from "../contract.api";
import { ContractStatus } from "../contract.constants";
import { addMonths, format } from "date-fns";
import { vi } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ContractActionsProps {
  contractId: number;
  status: ContractStatus;
  endDate: Date;
  isLandlord: boolean;
  onContractUpdated: () => void;
  openTerminateModal?: boolean;
  setOpenTerminateModal?: (open: boolean) => void;
  openRenewModal?: boolean;
  setOpenRenewModal?: (open: boolean) => void;
}

export function ContractActions({
  contractId,
  status,
  endDate,
  isLandlord,
  onContractUpdated,
  openTerminateModal,
  setOpenTerminateModal,
  openRenewModal,
  setOpenRenewModal,
}: ContractActionsProps) {
  const [terminateReason, setTerminateReason] = useState("");
  const [terminateLoading, setTerminateLoading] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(
    openTerminateModal || false
  );

  const [renewLoading, setRenewLoading] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(
    openRenewModal || false
  );
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(
    addMonths(new Date(endDate), 6) // Mặc định gia hạn thêm 6 tháng
  );

  useEffect(() => {
    if (openTerminateModal !== undefined) {
      setTerminateDialogOpen(openTerminateModal);
    }
  }, [openTerminateModal]);

  useEffect(() => {
    if (openRenewModal !== undefined) {
      setRenewDialogOpen(openRenewModal);
    }
  }, [openRenewModal]);

  const handleTerminateDialogChange = (open: boolean) => {
    setTerminateDialogOpen(open);
    if (setOpenTerminateModal) {
      setOpenTerminateModal(open);
    }
  };

  const handleRenewDialogChange = (open: boolean) => {
    setRenewDialogOpen(open);
    if (setOpenRenewModal) {
      setOpenRenewModal(open);
    }
  };

  // Hàm xử lý chấm dứt hợp đồng
  const handleTerminateContract = async () => {
    if (!terminateReason.trim()) {
      toast.error("Vui lòng nhập lý do chấm dứt hợp đồng");
      return;
    }

    setTerminateLoading(true);
    try {
      await contractApiRequest.terminateContract(contractId, terminateReason);
      toast.success("Chấm dứt hợp đồng thành công");
      setTerminateDialogOpen(false);
      onContractUpdated();
    } catch (error) {
      console.error("Lỗi khi chấm dứt hợp đồng:", error);
      toast.error("Không thể chấm dứt hợp đồng. Vui lòng thử lại sau.");
    } finally {
      setTerminateLoading(false);
    }
  };

  // Hàm xử lý gia hạn hợp đồng
  const handleRenewContract = async () => {
    if (!newEndDate) {
      toast.error("Vui lòng chọn ngày kết thúc mới");
      return;
    }

    setRenewLoading(true);
    try {
      await contractApiRequest.renewContract(contractId, {
        endDate: newEndDate.toISOString(),
      });
      toast.success("Gia hạn hợp đồng thành công");
      setRenewDialogOpen(false);
      onContractUpdated();
    } catch (error) {
      console.error("Lỗi khi gia hạn hợp đồng:", error);
      toast.error("Không thể gia hạn hợp đồng. Vui lòng thử lại sau.");
    } finally {
      setRenewLoading(false);
    }
  };

  // Chỉ hiển thị các action cho chủ nhà và chỉ khi hợp đồng đang hoạt động hoặc đã gia hạn
  if (
    !isLandlord ||
    (status !== ContractStatus.ACTIVE && status !== ContractStatus.RENEWED)
  ) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Nút chấm dứt hợp đồng */}
      <Dialog
        open={terminateDialogOpen}
        onOpenChange={handleTerminateDialogChange}
      >
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <XCircle className="h-4 w-4 mr-2" />
            Chấm dứt hợp đồng
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chấm dứt hợp đồng</DialogTitle>
            <DialogDescription>
              Việc chấm dứt hợp đồng sẽ dẫn đến việc phòng trở lại trạng thái
              trống. Vui lòng nhập lý do chấm dứt hợp đồng.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-700">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p className="text-sm">
              Lưu ý: Hành động này không thể hoàn tác sau khi thực hiện.
            </p>
          </div>
          <Textarea
            placeholder="Nhập lý do chấm dứt hợp đồng..."
            value={terminateReason}
            onChange={(e) => setTerminateReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTerminateDialogOpen(false)}
              disabled={terminateLoading}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleTerminateContract}
              disabled={terminateLoading}
            >
              {terminateLoading ? "Đang xử lý..." : "Xác nhận chấm dứt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nút gia hạn hợp đồng */}
      <Dialog open={renewDialogOpen} onOpenChange={handleRenewDialogChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <RotateCw className="h-4 w-4 mr-2" />
            Gia hạn hợp đồng
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gia hạn hợp đồng</DialogTitle>
            <DialogDescription>
              Chọn ngày kết thúc mới cho hợp đồng. Hợp đồng hiện tại sẽ kết thúc
              vào ngày {format(new Date(endDate), "dd/MM/yyyy")}.
            </DialogDescription>
          </DialogHeader>
          <div>
            <p className="mb-2 font-medium">Ngày kết thúc mới:</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !newEndDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newEndDate ? (
                    format(newEndDate, "PPP", { locale: vi })
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newEndDate}
                  onSelect={setNewEndDate}
                  initialFocus
                  disabled={(date) => date <= new Date(endDate)}
                />
              </PopoverContent>
            </Popover>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenewDialogOpen(false)}
              disabled={renewLoading}
            >
              Hủy
            </Button>
            <Button
              variant="default"
              onClick={handleRenewContract}
              disabled={renewLoading || !newEndDate}
            >
              {renewLoading ? "Đang xử lý..." : "Gia hạn hợp đồng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
