"use client";

import type { Dispatch, SetStateAction } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useCreateRoleUpgradeRequest } from "@/features/role-upgrade-request/role-upgrade-request.hook";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { useUploadImages } from "@/features/media/useMedia";
import { ImageUploadSlots } from "@/features/rental/component/image-upload-slots";
import { ImageSlot } from "@/types/images.type";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

interface LandlordDialogProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  landlordStatus: any;
  setLandlordStatus: Dispatch<SetStateAction<any>>;
}

export default function LandlordDialog({
  isOpen,
  setIsOpen,
  isLoading,
  setIsLoading,
  landlordStatus,
  setLandlordStatus,
}: LandlordDialogProps) {
  const [reason, setReason] = useState("");
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([null, null]);
  const { mutate: createRequest, isPending } = useCreateRoleUpgradeRequest();
  const { mutateAsync: uploadImages } = useUploadImages();

  const validateFile = (file: File) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh JPG hoặc PNG");
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Kích thước file không được vượt quá 5MB");
      return false;
    }
    return true;
  };

  async function onLandlordRequest() {
    if (isPending) return;

    const frontImage = imageSlots[0]?.file;
    const backImage = imageSlots[1]?.file;

    if (!frontImage || !backImage) {
      toast.error("Vui lòng chọn đầy đủ ảnh CCCD");
      return;
    }
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do");
      return;
    }

    try {
      setIsLoading(true);
      // Upload ảnh khi submit
      const formData = new FormData();
      formData.append("images", frontImage);
      formData.append("images", backImage);

      const uploadResult = await uploadImages(formData);
      const [frontImageUrl, backImageUrl] = uploadResult.payload.map(
        (img) => img.url
      );

      // Tạo yêu cầu
      createRequest(
        {
          reason: reason.trim(),
          frontImage: frontImageUrl,
          backImage: backImageUrl,
        },
        {
          onSuccess: () => {
            toast.success("Gửi yêu cầu thành công");
            setIsOpen(false);
            setReason("");
            setImageSlots([null, null]);
            setLandlordStatus("pending");
          },
          onError: (error) => {
            toast.error(error.message || "Có lỗi xảy ra");
          },
          onSettled: () => {
            setIsLoading(false);
          },
        }
      );
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tải ảnh lên");
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"} disabled={landlordStatus === "pending"}>
          Đăng ký ngay
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký trở thành người cho thuê</DialogTitle>
          <DialogDescription>
            Hoàn thành đăng ký để bắt đầu cho thuê và kinh doanh trên nền tảng
            của chúng tôi.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Quyền lợi của người cho thuê:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Đăng tin cho thuê không giới hạn</li>
              <li>Tiếp cận hàng ngàn khách hàng tiềm năng</li>
              <li>Công cụ quản lý cho thuê chuyên nghiệp</li>
              <li>Hỗ trợ kỹ thuật ưu tiên</li>
              <li>Báo cáo và phân tích chi tiết</li>
            </ul>
          </div>
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Yêu cầu:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Xác minh danh tính</li>
              <li>Cung cấp thông tin pháp lý về tài sản</li>
              <li>Tuân thủ các quy định và chính sách của nền tảng</li>
            </ul>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Ảnh CCCD (JPG/PNG, tối đa 5MB)</Label>
              <div className="grid grid-cols-2 gap-4">
                <ImageUploadSlots
                  imageSlots={imageSlots.map((slot) =>
                    slot
                      ? { imageUrl: slot.previewUrl || "", order: slot.order }
                      : null
                  )}
                  handleImageUpload={(e, slotIndex) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      if (validateFile(file)) {
                        const previewUrl = URL.createObjectURL(file);
                        const newImageSlots = [...imageSlots];
                        newImageSlots[slotIndex] = {
                          file,
                          previewUrl,
                          order: slotIndex + 1,
                        };
                        setImageSlots(newImageSlots);
                      }
                    }
                  }}
                  removeImage={(slotIndex) => {
                    const newImageSlots = [...imageSlots];
                    if (newImageSlots[slotIndex]?.previewUrl) {
                      URL.revokeObjectURL(newImageSlots[slotIndex]!.previewUrl);
                    }
                    newImageSlots[slotIndex] = null;
                    setImageSlots(newImageSlots);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lý do đăng ký</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Nhập lý do bạn muốn trở thành người cho thuê..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={onLandlordRequest}
            disabled={
              isLoading || !reason.trim() || !imageSlots[0] || !imageSlots[1]
            }
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận đăng ký
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
