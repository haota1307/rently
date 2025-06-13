"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, X, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";
import { ErrorAlert } from "./error-alert";

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  title?: string;
  description?: string;
}

export function CameraCapture({
  isOpen,
  onClose,
  onCapture,
  title = "Chụp ảnh",
  description = "Đặt khuôn mặt vào khung hình và nhấn nút chụp",
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Khởi động camera
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setCameraError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user", // Camera trước
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (error: any) {
      console.error("Lỗi truy cập camera:", error);

      let errorMessage = "Không thể truy cập camera";

      if (error.name === "NotAllowedError") {
        errorMessage =
          "Quyền truy cập camera bị từ chối. Vui lòng cho phép quyền truy cập camera trong trình duyệt.";
      } else if (error.name === "NotFoundError") {
        errorMessage =
          "Không tìm thấy camera trên thiết bị. Vui lòng kiểm tra camera và thử lại.";
      } else if (error.name === "NotReadableError") {
        errorMessage =
          "Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng các ứng dụng khác và thử lại.";
      } else if (error.name === "OverconstrainedError") {
        errorMessage =
          "Camera không hỗ trợ cấu hình yêu cầu. Vui lòng thử với camera khác.";
      }

      setCameraError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dừng camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCapturedImage(null);
    setCameraError(null);
  }, []);

  // Chụp ảnh
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Thiết lập kích thước canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Vẽ frame hiện tại từ video lên canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Chuyển đổi thành blob và tạo file
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = canvas.toDataURL("image/jpeg", 0.8);
          setCapturedImage(imageUrl);
        }
      },
      "image/jpeg",
      0.8
    );
  }, []);

  // Xác nhận và gửi ảnh đã chụp
  const confirmCapture = useCallback(() => {
    if (!canvasRef.current || !capturedImage) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `selfie-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
          onClose();
        }
      },
      "image/jpeg",
      0.8
    );
  }, [capturedImage, onCapture, onClose]);

  // Chụp lại
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  // Xử lý mở/đóng dialog
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera preview hoặc ảnh đã chụp */}
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            {capturedImage ? (
              <img
                src={capturedImage}
                alt="Ảnh đã chụp"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* Overlay khung hướng dẫn */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white/50 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="w-48 h-64 border-2 border-white/70 rounded-2xl"></div>
                  </div>
                </div>

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p>Đang khởi động camera...</p>
                    </div>
                  </div>
                )}

                {/* Lỗi camera */}
                {!isLoading && !isStreaming && cameraError && (
                  <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-sm">
                      <ErrorAlert
                        type="camera"
                        message={cameraError}
                        onRetry={startCamera}
                        isRetrying={isLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Camera không khả dụng (fallback) */}
                {!isLoading && !isStreaming && !cameraError && (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-2" />
                      <p>Camera không khả dụng</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Canvas ẩn để capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Hướng dẫn */}
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p>• Đảm bảo khuôn mặt nằm trong khung hình</p>
            <p>• Giữ thiết bị ổn định khi chụp</p>
            <p>• Chụp trong điều kiện ánh sáng tốt</p>
          </div>
        </div>

        <DialogFooter>
          {capturedImage ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={retakePhoto}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Chụp lại
              </Button>
              <Button onClick={confirmCapture} className="flex-1">
                <Check className="h-4 w-4 mr-2" />
                Xác nhận
              </Button>
            </div>
          ) : (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={!isStreaming || isLoading}
                className="flex-1"
              >
                <Camera className="h-4 w-4 mr-2" />
                Chụp ảnh
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
