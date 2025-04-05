import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AmenityType } from "@/schemas/amenity.schema";

interface ViewAmenityModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenity: AmenityType | null;
}

export function ViewAmenityModal({
  isOpen,
  onClose,
  amenity,
}: ViewAmenityModalProps) {
  if (!amenity) return null;

  // Đảm bảo xử lý đúng ngày tạo
  const formatDate = (dateValue: Date | string | null) => {
    if (!dateValue) return "Không xác định";

    try {
      const date = new Date(dateValue);
      return date.toLocaleDateString("vi-VN");
    } catch (error) {
      return "Không xác định";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chi tiết tiện ích</DialogTitle>
          <DialogDescription>
            Thông tin chi tiết về tiện ích trong hệ thống.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium">ID</div>
            <div className="col-span-2 text-sm">#{amenity.id}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium">Tên tiện ích</div>
            <div className="col-span-2 text-sm">{amenity.name}</div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-sm font-medium">Ngày tạo</div>
            <div className="col-span-2 text-sm">
              {formatDate(amenity.createdAt)}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
