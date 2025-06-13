import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  WifiOff,
  Camera,
  Shield,
  RefreshCw,
  HelpCircle,
} from "lucide-react";

interface ErrorAlertProps {
  type: "network" | "camera" | "verification" | "upload" | "general";
  title?: string;
  message: string;
  onRetry?: () => void;
  onHelp?: () => void;
  suggestions?: string[];
  isRetrying?: boolean;
}

const errorConfig = {
  network: {
    icon: WifiOff,
    title: "Lỗi kết nối",
    color: "destructive" as const,
    suggestions: [
      "Kiểm tra kết nối internet",
      "Thử lại sau vài giây",
      "Kiểm tra tường lửa hoặc VPN",
    ],
  },
  camera: {
    icon: Camera,
    title: "Lỗi camera",
    color: "destructive" as const,
    suggestions: [
      "Cho phép quyền truy cập camera",
      "Đảm bảo camera không bị ứng dụng khác sử dụng",
      "Thử làm mới trang và chọn lại",
    ],
  },
  verification: {
    icon: Shield,
    title: "Lỗi xác thực",
    color: "destructive" as const,
    suggestions: [
      "Chụp ảnh trong điều kiện ánh sáng tốt, tránh ngược sáng",
      "Đảm bảo khuôn mặt rõ nét, nhìn thẳng vào camera",
      "Chỉ có 1 khuôn mặt trong mỗi ảnh (selfie và CCCD)",
      "Sử dụng ảnh CCCD gốc, không photocopy hoặc chụp màn hình",
      "Kiểm tra định dạng file (chỉ hỗ trợ JPG, PNG)",
    ],
  },
  upload: {
    icon: AlertTriangle,
    title: "Lỗi tải ảnh",
    color: "destructive" as const,
    suggestions: [
      "Kiểm tra kích thước file (tối đa 5MB)",
      "Chỉ hỗ trợ file JPG, PNG",
      "Thử chọn ảnh khác",
    ],
  },
  general: {
    icon: AlertTriangle,
    title: "Có lỗi xảy ra",
    color: "destructive" as const,
    suggestions: ["Thử lại sau vài phút", "Liên hệ hỗ trợ nếu lỗi tiếp tục"],
  },
};

export function ErrorAlert({
  type,
  title,
  message,
  onRetry,
  onHelp,
  suggestions,
  isRetrying = false,
}: ErrorAlertProps) {
  const config = errorConfig[type];
  const Icon = config.icon;
  const displaySuggestions = suggestions || config.suggestions;

  return (
    <Alert variant={config.color} className="border-l-4">
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        {title || config.title}
        {onHelp && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onHelp}
            className="h-auto p-1"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="space-y-3">
          <p>{message}</p>

          {displaySuggestions.length > 0 && (
            <div>
              <p className="font-medium text-sm mb-2">Gợi ý khắc phục:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {displaySuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {onRetry && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                disabled={isRetrying}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`}
                />
                {isRetrying ? "Đang thử lại..." : "Thử lại"}
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
