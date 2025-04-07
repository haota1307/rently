import { useState } from "react";
import { useAppStore } from "@/components/app-provider";
import { useCreateRoleUpgradeRequest } from "./role-upgrade-request.hook";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Role } from "@/constants/type";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useUploadImage } from "@/features/media/useMedia";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png"];

export function RoleUpgradeRequest() {
  const { role } = useAppStore();
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [frontImageUrl, setFrontImageUrl] = useState<string>("");
  const [backImageUrl, setBackImageUrl] = useState<string>("");
  const { mutate: createRequest, isPending } = useCreateRoleUpgradeRequest();
  const { mutateAsync: uploadImage } = useUploadImage();

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

  const handleFileChange = async (
    file: File | undefined,
    setFile: (file: File | null) => void,
    setUrl: (url: string) => void
  ) => {
    if (!file) return;
    if (validateFile(file)) {
      setFile(file);
      try {
        const formData = new FormData();
        formData.append("images", file);
        const result = await uploadImage(formData);
        const url = result.payload.url;
        if (!url) {
          throw new Error("Không thể lấy URL ảnh");
        }
        setUrl(url);
      } catch (error) {
        toast.error("Có lỗi xảy ra khi tải ảnh lên");
        setFile(null);
      }
    }
  };

  const handleSubmit = () => {
    if (!frontImageUrl || !backImageUrl) {
      toast.error("Vui lòng chọn đầy đủ ảnh CCCD");
      return;
    }
    if (!reason.trim()) {
      toast.error("Vui lòng nhập lý do");
      return;
    }

    createRequest(
      {
        reason: reason.trim(),
        frontImage: frontImageUrl,
        backImage: backImageUrl,
      },
      {
        onSuccess: () => {
          toast.success("Gửi yêu cầu thành công");
          setOpen(false);
          setReason("");
          setFrontImage(null);
          setBackImage(null);
          setFrontImageUrl("");
          setBackImageUrl("");
        },
        onError: (error) => {
          toast.error(error.message || "Có lỗi xảy ra");
        },
      }
    );
  };

  if (!role || role !== Role.Client) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Yêu cầu nâng cấp lên chủ trọ</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yêu cầu nâng cấp lên chủ trọ</DialogTitle>
          <DialogDescription>
            Bạn có thể gửi yêu cầu nâng cấp lên chủ trọ. Yêu cầu của bạn sẽ được
            xem xét bởi quản trị viên.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ảnh CCCD (JPG/PNG, tối đa 5MB)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frontImage" className="text-sm">
                  Mặt trước
                </Label>
                <div
                  className={cn(
                    "mt-1 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10",
                    frontImage && "border-solid border-primary"
                  )}
                >
                  <div className="text-center">
                    {frontImageUrl ? (
                      <img
                        src={frontImageUrl}
                        alt="Mặt trước CCCD"
                        className="mx-auto h-24 w-auto"
                      />
                    ) : (
                      <Upload
                        className="mx-auto h-12 w-12 text-gray-300"
                        aria-hidden="true"
                      />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="frontImage"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                      >
                        <span>{frontImage ? frontImage.name : "Chọn ảnh"}</span>
                        <input
                          id="frontImage"
                          name="frontImage"
                          type="file"
                          accept="image/jpeg,image/png"
                          className="sr-only"
                          onChange={(e) =>
                            handleFileChange(
                              e.target.files?.[0],
                              setFrontImage,
                              setFrontImageUrl
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="backImage" className="text-sm">
                  Mặt sau
                </Label>
                <div
                  className={cn(
                    "mt-1 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10",
                    backImage && "border-solid border-primary"
                  )}
                >
                  <div className="text-center">
                    {backImageUrl ? (
                      <img
                        src={backImageUrl}
                        alt="Mặt sau CCCD"
                        className="mx-auto h-24 w-auto"
                      />
                    ) : (
                      <Upload
                        className="mx-auto h-12 w-12 text-gray-300"
                        aria-hidden="true"
                      />
                    )}
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="backImage"
                        className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary/80"
                      >
                        <span>{backImage ? backImage.name : "Chọn ảnh"}</span>
                        <input
                          id="backImage"
                          name="backImage"
                          type="file"
                          accept="image/jpeg,image/png"
                          className="sr-only"
                          onChange={(e) =>
                            handleFileChange(
                              e.target.files?.[0],
                              setBackImage,
                              setBackImageUrl
                            )
                          }
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Lý do đăng ký</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do bạn muốn trở thành chủ trọ..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isPending || !reason.trim() || !frontImageUrl || !backImageUrl
            }
          >
            {isPending ? "Đang gửi..." : "Gửi yêu cầu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
