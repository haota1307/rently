"use client";

import type { Dispatch, SetStateAction } from "react";
import {
  Loader2,
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  User,
  Shield,
} from "lucide-react";
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
import { Role } from "@/constants/type";
import { useAppStore } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

interface FaceVerificationStep {
  selfieImage: File | null;
  verificationResult: {
    isMatch: boolean;
    similarity: number;
    message: string;
  } | null;
}

interface LandlordDialogProps {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  landlordStatus: any;
  setLandlordStatus: Dispatch<SetStateAction<any>>;
}

export default function LandlordDialogSimple({
  isOpen,
  setIsOpen,
  isLoading,
  setIsLoading,
  landlordStatus,
  setLandlordStatus,
}: LandlordDialogProps) {
  const { role } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [reason, setReason] = useState("");
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([null, null]);
  const [faceVerification, setFaceVerification] =
    useState<FaceVerificationStep>({
      selfieImage: null,
      verificationResult: null,
    });
  const { mutate: createRequest, isPending } = useCreateRoleUpgradeRequest();
  const { mutateAsync: uploadImages } = useUploadImages();

  // Nếu là admin hoặc đã là landlord thì không hiển thị dialog
  if (role === Role.Admin || role === Role.Landlord) {
    return null;
  }

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

  // Xác thực khuôn mặt với API FPT.AI
  const verifyFace = async () => {
    if (!faceVerification.selfieImage || !imageSlots[0]?.file) {
      toast.error("Vui lòng chụp ảnh selfie và upload ảnh CCCD mặt trước");
      return;
    }

    try {
      setIsLoading(true);

      // Gọi API xác thực khuôn mặt FPT.AI
      const formData = new FormData();
      formData.append("file[]", faceVerification.selfieImage);
      formData.append("file[]", imageSlots[0].file);

      const response = await fetch("/api/face-verification", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.code === "200") {
        const { isMatch, similarity } = result.data;

        if (isMatch && similarity >= 80) {
          setFaceVerification((prev) => ({
            ...prev,
            verificationResult: {
              isMatch: true,
              similarity,
              message: `Xác thực thành công! Độ giống nhau: ${similarity.toFixed(2)}%`,
            },
          }));
          toast.success("Xác thực khuôn mặt thành công!");
          setCurrentStep(2); // Chuyển sang bước cuối
        } else {
          setFaceVerification((prev) => ({
            ...prev,
            verificationResult: {
              isMatch: false,
              similarity,
              message: `Xác thực thất bại. Độ giống nhau: ${similarity.toFixed(2)}% (Yêu cầu tối thiểu 80%)`,
            },
          }));
          toast.error("Xác thực khuôn mặt thất bại. Vui lòng thử lại!");
        }
      } else {
        throw new Error(result.message || "Lỗi xác thực khuôn mặt");
      }
    } catch (error) {
      console.error("Face verification error:", error);
      toast.error("Có lỗi xảy ra khi xác thực khuôn mặt. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
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
      if (faceVerification.selfieImage) {
        formData.append("images", faceVerification.selfieImage);
      }

      const uploadResult = await uploadImages(formData);
      const imageUrls = uploadResult.payload.map((img) => img.url);
      const [frontImageUrl, backImageUrl, selfieImageUrl] = imageUrls;

      // Tạo yêu cầu cơ bản (bỏ qua face verification data tạm thời)
      createRequest(
        {
          reason: reason.trim(),
          frontImage: frontImageUrl,
          backImage: backImageUrl,
          // selfieImage: selfieImageUrl,
          // faceVerificationData: faceVerification.verificationResult ? {
          //   similarity: faceVerification.verificationResult.similarity,
          //   isVerified: faceVerification.verificationResult.isMatch,
          //   timestamp: new Date().toISOString(),
          // } : undefined,
        },
        {
          onSuccess: () => {
            toast.success("Gửi yêu cầu thành công");
            setIsOpen(false);
            // Reset form
            setCurrentStep(0);
            setReason("");
            setImageSlots([null, null]);
            setFaceVerification({
              selfieImage: null,
              verificationResult: null,
            });
            setLandlordStatus("PENDING");
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

  const steps = [
    {
      title: "Upload CCCD",
      description: "Tải lên ảnh CCCD mặt trước và sau",
      icon: <User className="h-4 w-4" />,
    },
    {
      title: "Xác thực khuôn mặt",
      description: "Chụp ảnh selfie để xác thực danh tính",
      icon: <Camera className="h-4 w-4" />,
    },
    {
      title: "Hoàn thành",
      description: "Nhập lý do và gửi yêu cầu",
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={"outline"} disabled={landlordStatus === "PENDING"}>
          {landlordStatus === "REJECTED" ? "Gửi lại yêu cầu" : "Đăng ký ngay"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng ký trở thành người cho thuê</DialogTitle>
          <DialogDescription>
            {landlordStatus === "REJECTED"
              ? "Yêu cầu trước của bạn đã bị từ chối. Vui lòng cung cấp thông tin chính xác và đầy đủ để được phê duyệt."
              : "Hoàn thành đăng ký để bắt đầu cho thuê và kinh doanh trên nền tảng của chúng tôi."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Simple stepper */}
          <div className="mb-6">
            <div className="flex justify-center items-center gap-4">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      index <= currentStep
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground text-muted-foreground"
                    }`}
                  >
                    {index < currentStep ? "✓" : index + 1}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        index < currentStep
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-2">
              <div className="font-medium">{steps[currentStep]?.title}</div>
              <div className="text-sm text-muted-foreground">
                {steps[currentStep]?.description}
              </div>
            </div>
          </div>

          {/* Step 0: Upload CCCD */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Upload ảnh CCCD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Ảnh CCCD (JPG/PNG, tối đa 5MB)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <ImageUploadSlots
                      imageSlots={imageSlots.map((slot) =>
                        slot
                          ? {
                              imageUrl: slot.previewUrl || "",
                              order: slot.order,
                            }
                          : null
                      )}
                      handleImageUpload={(
                        e: React.ChangeEvent<HTMLInputElement>,
                        slotIndex: number
                      ) => {
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
                      removeImage={(slotIndex: number) => {
                        const newImageSlots = [...imageSlots];
                        if (newImageSlots[slotIndex]?.previewUrl) {
                          URL.revokeObjectURL(
                            newImageSlots[slotIndex]!.previewUrl
                          );
                        }
                        newImageSlots[slotIndex] = null;
                        setImageSlots(newImageSlots);
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => setCurrentStep(1)}
                    disabled={!imageSlots[0] || !imageSlots[1]}
                  >
                    Tiếp tục
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 1: Face Verification */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Xác thực khuôn mặt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertTitle>Xác thực danh tính tự động</AlertTitle>
                  <AlertDescription>
                    Hệ thống sẽ so sánh khuôn mặt trong ảnh selfie với ảnh trong
                    CCCD để xác thực danh tính của bạn.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label>Ảnh selfie (JPG/PNG, tối đa 5MB)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {faceVerification.selfieImage ? (
                      <div className="text-center">
                        <img
                          src={URL.createObjectURL(
                            faceVerification.selfieImage
                          )}
                          alt="Selfie"
                          className="mx-auto max-w-[200px] max-h-[200px] rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() =>
                            setFaceVerification((prev) => ({
                              ...prev,
                              selfieImage: null,
                            }))
                          }
                        >
                          Chụp lại
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && validateFile(file)) {
                              setFaceVerification((prev) => ({
                                ...prev,
                                selfieImage: file,
                                verificationResult: null,
                              }));
                            }
                          }}
                          className="hidden"
                          id="selfie-upload"
                        />
                        <Label
                          htmlFor="selfie-upload"
                          className="cursor-pointer"
                        >
                          <div className="text-sm font-medium">
                            Chụp ảnh selfie
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Nhấn để chọn ảnh từ thiết bị
                          </div>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kết quả xác thực */}
                {faceVerification.verificationResult && (
                  <Alert
                    variant={
                      faceVerification.verificationResult.isMatch
                        ? "default"
                        : "destructive"
                    }
                  >
                    {faceVerification.verificationResult.isMatch ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                      {faceVerification.verificationResult.isMatch
                        ? "Xác thực thành công"
                        : "Xác thực thất bại"}
                    </AlertTitle>
                    <AlertDescription>
                      {faceVerification.verificationResult.message}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(0)}>
                    Quay lại
                  </Button>
                  <div className="space-x-2">
                    {faceVerification.selfieImage &&
                      !faceVerification.verificationResult?.isMatch && (
                        <Button onClick={verifyFace} disabled={isLoading}>
                          {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Xác thực khuôn mặt
                        </Button>
                      )}
                    {/* Cho phép tiếp tục mà không cần xác thực khuôn mặt */}
                    <Button onClick={() => setCurrentStep(2)}>Tiếp tục</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Final Step */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Hoàn thành đăng ký
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Hiển thị thông tin đã xác thực nếu có */}
                {faceVerification.verificationResult?.isMatch && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Danh tính đã được xác thực</AlertTitle>
                    <AlertDescription>
                      Khuôn mặt của bạn đã được xác thực thành công với độ chính
                      xác{" "}
                      {faceVerification.verificationResult?.similarity.toFixed(
                        2
                      )}
                      %
                    </AlertDescription>
                  </Alert>
                )}

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">
                    Quyền lợi của người cho thuê:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Truy cập trang quản lý cho thuê chuyên nghiệp</li>
                    <li>Đăng bài cho thuê không giới hạn</li>
                    <li>Quản lý phòng trọ và hợp đồng</li>
                    <li>Nhận yêu cầu thuê và lịch xem phòng</li>
                    <li>Hỗ trợ khách hàng ưu tiên</li>
                    <li>Báo cáo thống kê chi tiết</li>
                  </ul>
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

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Quay lại
                  </Button>
                  <Button
                    onClick={onLandlordRequest}
                    disabled={isLoading || !reason.trim()}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Xác nhận đăng ký
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
