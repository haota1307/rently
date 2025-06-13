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
import { ImageSlot } from "@/types/images.type";
import { Role } from "@/constants/type";
import { useAppStore } from "@/components/app-provider";
// import { Stepper } from "@/components/ui/stepper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CameraCapture } from "@/components/ui/camera-capture";
import { ErrorAlert } from "@/components/ui/error-alert";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/jpg", "image/png"];

// Helper function để lấy suggestions cụ thể cho từng loại lỗi FPT.AI
const getFaceVerificationSuggestions = (errorMessage: string): string[] => {
  if (errorMessage.includes("Không nhận dạng được khuôn mặt")) {
    return [
      "Chụp ảnh trong điều kiện ánh sáng tốt",
      "Đảm bảo khuôn mặt rõ nét và không bị che khuất",
      "Tránh chụp ảnh ngược sáng hoặc quá tối",
      "Thử chụp lại với góc camera khác",
    ];
  }
  if (errorMessage.includes("không đúng định dạng")) {
    return [
      "Sử dụng file ảnh JPG hoặc PNG",
      "Kiểm tra file không bị hỏng",
      "Thử chụp ảnh mới thay vì sử dụng ảnh cũ",
    ];
  }
  if (errorMessage.includes("nhiều hơn hoặc ít hơn 2 khuôn mặt")) {
    return [
      "Đảm bảo chỉ có 1 khuôn mặt trong ảnh selfie",
      "Đảm bảo chỉ có 1 khuôn mặt trong ảnh CCCD",
      "Tránh chụp ảnh có nhiều người",
      "Kiểm tra ảnh CCCD không bị mờ hoặc che khuất",
    ];
  }
  if (errorMessage.includes("Độ giống nhau")) {
    return [
      "Đảm bảo là cùng 1 người trong cả 2 ảnh",
      "Chụp selfie trong điều kiện ánh sáng tương tự CCCD",
      "Tránh sử dụng filter hoặc chỉnh sửa ảnh",
      "Thử chụp lại selfie với biểu cảm tự nhiên",
    ];
  }
  return [
    "Chụp ảnh trong điều kiện ánh sáng tốt",
    "Đảm bảo khuôn mặt rõ nét, nhìn thẳng vào camera",
    "Sử dụng ảnh CCCD gốc, không photocopy",
    "Thử chụp lại ảnh selfie mới",
  ];
};

interface FaceVerificationStep {
  selfieImage: File | null;
  verificationResult: {
    isMatch: boolean;
    similarity: number;
    message: string;
    apiResponseCode?: string;
  } | null;
  error: string | null;
}

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
  const { role } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [reason, setReason] = useState("");
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([null, null]);
  const [faceVerification, setFaceVerification] =
    useState<FaceVerificationStep>({
      selfieImage: null,
      verificationResult: null,
      error: null,
    });
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const [cameraMode, setCameraMode] = useState<
    "selfie" | "cccd-front" | "cccd-back" | null
  >(null);
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
      setFaceVerification((prev) => ({
        ...prev,
        error: "Vui lòng chụp ảnh selfie và upload ảnh CCCD mặt trước",
      }));
      return;
    }

    try {
      setIsLoading(true);
      setFaceVerification((prev) => ({ ...prev, error: null }));

      // Gọi API xác thực khuôn mặt FPT.AI
      const formData = new FormData();
      formData.append("file[]", faceVerification.selfieImage);
      formData.append("file[]", imageSlots[0].file);

      const response = await fetch("/api/face-verification", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

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
              apiResponseCode: result.code,
            },
            error: null,
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
              apiResponseCode: result.code,
            },
            error: null,
          }));
        }
      } else if (result.code === "407") {
        throw new Error(
          "Không nhận dạng được khuôn mặt trong ảnh. Vui lòng chụp ảnh rõ nét hơn với đủ ánh sáng"
        );
      } else if (result.code === "408") {
        throw new Error(
          "Ảnh đầu vào không đúng định dạng. Vui lòng sử dụng file ảnh JPG hoặc PNG"
        );
      } else if (result.code === "409") {
        throw new Error(
          "Phát hiện nhiều hơn hoặc ít hơn 2 khuôn mặt. Vui lòng đảm bảo chỉ có 1 khuôn mặt trong mỗi ảnh"
        );
      } else if (result.code === "400") {
        throw new Error(
          "Dữ liệu đầu vào không hợp lệ. Vui lòng kiểm tra lại ảnh"
        );
      } else if (result.code === "401") {
        throw new Error("API key không hợp lệ. Vui lòng liên hệ quản trị viên");
      } else if (result.code === "429") {
        throw new Error(
          "Đã vượt quá giới hạn API. Vui lòng thử lại sau ít phút"
        );
      } else {
        throw new Error(
          result.message || `Lỗi xác thực khuôn mặt (Code: ${result.code})`
        );
      }
    } catch (error: any) {
      console.error("Face verification error:", error);

      let errorMessage = "Có lỗi xảy ra khi xác thực khuôn mặt";

      if (
        error.message.includes("NetworkError") ||
        error.message.includes("Failed to fetch")
      ) {
        errorMessage =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet";
      } else if (error.message.includes("HTTP 500")) {
        errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau vài phút";
      } else if (error.message.includes("HTTP 413")) {
        errorMessage =
          "File ảnh quá lớn. Vui lòng sử dụng ảnh có kích thước nhỏ hơn";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setFaceVerification((prev) => ({
        ...prev,
        error: errorMessage,
        verificationResult: null,
      }));
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
    if (!faceVerification.verificationResult?.isMatch) {
      toast.error("Vui lòng hoàn thành xác thực khuôn mặt");
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
      const [frontImageUrl, backImageUrl, selfieImageUrl] =
        uploadResult.payload.map((img) => img.url);

      // Tạo yêu cầu với thông tin xác thực khuôn mặt
      createRequest(
        {
          reason: reason.trim(),
          frontImage: frontImageUrl,
          backImage: backImageUrl,
          selfieImage: selfieImageUrl,
          faceVerificationData: {
            similarity: faceVerification.verificationResult.similarity,
            isVerified: faceVerification.verificationResult.isMatch,
            timestamp: new Date().toISOString(),
            apiResponseCode:
              faceVerification.verificationResult.apiResponseCode,
          },
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
              error: null,
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
          {/* Stepper */}
          {/* <Stepper steps={steps} currentStep={currentStep} className="mb-6" /> */}
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
                <div className="space-y-4">
                  <Label>Ảnh CCCD (JPG/PNG, tối đa 5MB)</Label>

                  {/* CCCD Mặt trước */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      CCCD Mặt trước
                    </Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      {imageSlots[0] ? (
                        <div className="text-center">
                          <img
                            src={imageSlots[0].previewUrl || ""}
                            alt="CCCD mặt trước"
                            className="mx-auto max-w-[200px] max-h-[120px] rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              if (imageSlots[0]?.previewUrl) {
                                URL.revokeObjectURL(imageSlots[0].previewUrl);
                              }
                              const newImageSlots = [...imageSlots];
                              newImageSlots[0] = null;
                              setImageSlots(newImageSlots);
                            }}
                          >
                            Xóa ảnh
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-3">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCameraMode("cccd-front");
                                setShowCameraCapture(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Chụp
                            </Button>
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (
                                    e.target.files &&
                                    e.target.files.length > 0
                                  ) {
                                    const file = e.target.files[0];
                                    if (validateFile(file)) {
                                      const previewUrl =
                                        URL.createObjectURL(file);
                                      const newImageSlots = [...imageSlots];
                                      newImageSlots[0] = {
                                        file,
                                        previewUrl,
                                        order: 1,
                                      };
                                      setImageSlots(newImageSlots);
                                    }
                                  }
                                }}
                                className="hidden"
                                id="cccd-front-upload"
                              />
                              <Label htmlFor="cccd-front-upload">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer flex items-center gap-2"
                                  asChild
                                >
                                  <span>
                                    <Upload className="h-4 w-4" />
                                    Chọn file
                                  </span>
                                </Button>
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CCCD Mặt sau */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">CCCD Mặt sau</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
                      {imageSlots[1] ? (
                        <div className="text-center">
                          <img
                            src={imageSlots[1].previewUrl || ""}
                            alt="CCCD mặt sau"
                            className="mx-auto max-w-[200px] max-h-[120px] rounded-lg"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              if (imageSlots[1]?.previewUrl) {
                                URL.revokeObjectURL(imageSlots[1].previewUrl);
                              }
                              const newImageSlots = [...imageSlots];
                              newImageSlots[1] = null;
                              setImageSlots(newImageSlots);
                            }}
                          >
                            Xóa ảnh
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center space-y-3">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCameraMode("cccd-back");
                                setShowCameraCapture(true);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Chụp
                            </Button>
                            <div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (
                                    e.target.files &&
                                    e.target.files.length > 0
                                  ) {
                                    const file = e.target.files[0];
                                    if (validateFile(file)) {
                                      const previewUrl =
                                        URL.createObjectURL(file);
                                      const newImageSlots = [...imageSlots];
                                      newImageSlots[1] = {
                                        file,
                                        previewUrl,
                                        order: 2,
                                      };
                                      setImageSlots(newImageSlots);
                                    }
                                  }
                                }}
                                className="hidden"
                                id="cccd-back-upload"
                              />
                              <Label htmlFor="cccd-back-upload">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="cursor-pointer flex items-center gap-2"
                                  asChild
                                >
                                  <span>
                                    <Upload className="h-4 w-4" />
                                    Chọn file
                                  </span>
                                </Button>
                              </Label>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
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
                        <div className="flex gap-2 justify-center mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setFaceVerification((prev) => ({
                                ...prev,
                                selfieImage: null,
                              }))
                            }
                          >
                            Xóa ảnh
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4">
                        <Camera className="h-12 w-12 mx-auto text-muted-foreground" />
                        <div className="text-sm font-medium">
                          Chụp ảnh selfie để xác thực
                        </div>

                        {/* 2 tùy chọn: Camera hoặc chọn file */}
                        <div className="flex gap-3 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCameraMode("selfie");
                              setShowCameraCapture(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Camera className="h-4 w-4" />
                            Chụp từ camera
                          </Button>

                          <div>
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
                                    error: null,
                                  }));
                                }
                              }}
                              className="hidden"
                              id="selfie-upload"
                            />
                            <Label htmlFor="selfie-upload">
                              <Button
                                variant="outline"
                                size="sm"
                                className="cursor-pointer flex items-center gap-2"
                                asChild
                              >
                                <span>
                                  <Upload className="h-4 w-4" />
                                  Chọn từ thiết bị
                                </span>
                              </Button>
                            </Label>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Chọn một trong hai cách trên để tải ảnh selfie
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lỗi xác thực */}
                {faceVerification.error && (
                  <ErrorAlert
                    type="verification"
                    message={faceVerification.error}
                    suggestions={getFaceVerificationSuggestions(
                      faceVerification.error
                    )}
                    onRetry={
                      faceVerification.selfieImage && imageSlots[0]?.file
                        ? verifyFace
                        : undefined
                    }
                    isRetrying={isLoading}
                  />
                )}

                {/* Kết quả xác thực */}
                {faceVerification.verificationResult &&
                  !faceVerification.error && (
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
                        <div className="space-y-2">
                          <p>{faceVerification.verificationResult.message}</p>
                          {!faceVerification.verificationResult.isMatch && (
                            <div className="text-sm">
                              <p className="font-medium">Gợi ý cải thiện:</p>
                              <ul className="list-disc list-inside space-y-1 text-xs mt-1">
                                <li>
                                  Chụp ảnh selfie trong điều kiện ánh sáng tốt
                                </li>
                                <li>Đảm bảo khuôn mặt rõ nét và nhìn thẳng</li>
                                <li>Sử dụng ảnh CCCD gốc, không photocopy</li>
                              </ul>
                            </div>
                          )}
                        </div>
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
                    {faceVerification.verificationResult?.isMatch && (
                      <Button onClick={() => setCurrentStep(2)}>
                        Tiếp tục
                      </Button>
                    )}
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
                {/* Hiển thị thông tin đã xác thực */}
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Danh tính đã được xác thực</AlertTitle>
                  <AlertDescription>
                    Khuôn mặt của bạn đã được xác thực thành công với độ chính
                    xác{" "}
                    {faceVerification.verificationResult?.similarity.toFixed(2)}
                    %
                  </AlertDescription>
                </Alert>

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

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <h4 className="font-medium mb-2 text-blue-800">
                    🎉 Ưu đãi đặc biệt!
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    Sau khi được phê duyệt, bạn sẽ được{" "}
                    <strong>dùng thử miễn phí 30 ngày</strong> để trải nghiệm
                    đầy đủ tính năng cho thuê.
                  </p>
                  <p className="text-xs text-blue-600">
                    Sau 30 ngày, chỉ{" "}
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                    }).format(299000)}
                    /tháng để tiếp tục sử dụng.
                  </p>
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

      {/* Camera Capture Modal */}
      <CameraCapture
        isOpen={showCameraCapture}
        onClose={() => {
          setShowCameraCapture(false);
          setCameraMode(null);
        }}
        onCapture={(file) => {
          if (validateFile(file)) {
            if (cameraMode === "selfie") {
              setFaceVerification((prev) => ({
                ...prev,
                selfieImage: file,
                verificationResult: null,
                error: null,
              }));
            } else if (cameraMode === "cccd-front") {
              const previewUrl = URL.createObjectURL(file);
              const newImageSlots = [...imageSlots];
              newImageSlots[0] = { file, previewUrl, order: 1 };
              setImageSlots(newImageSlots);
            } else if (cameraMode === "cccd-back") {
              const previewUrl = URL.createObjectURL(file);
              const newImageSlots = [...imageSlots];
              newImageSlots[1] = { file, previewUrl, order: 2 };
              setImageSlots(newImageSlots);
            }
          }
          setShowCameraCapture(false);
          setCameraMode(null);
        }}
        title={
          cameraMode === "selfie"
            ? "Chụp ảnh selfie"
            : cameraMode === "cccd-front"
              ? "Chụp ảnh CCCD mặt trước"
              : "Chụp ảnh CCCD mặt sau"
        }
        description={
          cameraMode === "selfie"
            ? "Đặt khuôn mặt vào khung hình để chụp ảnh xác thực danh tính"
            : "Đặt CCCD vào khung hình, đảm bảo các thông tin rõ ràng và không bị mờ"
        }
      />
    </Dialog>
  );
}
