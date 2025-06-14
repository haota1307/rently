"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertCircle,
  RefreshCw,
  Wifi,
  Server,
  Bug,
  HelpCircle,
} from "lucide-react";

interface RecommendationErrorProps {
  error: {
    message: string;
    status?: number;
    code?: string;
  };
  onRetry?: () => void;
  className?: string;
}

export function RecommendationError({
  error,
  onRetry,
  className = "",
}: RecommendationErrorProps) {
  const getErrorDetails = () => {
    const status = error.status;
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes("fetch") || message.includes("network") || !status) {
      return {
        icon: <Wifi className="w-12 h-12 text-blue-400" />,
        title: "Lỗi kết nối",
        description:
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.",
        suggestion: "Thử lại sau vài giây",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        buttonColor: "border-blue-300 text-blue-700 hover:bg-blue-50",
      };
    }

    // Server errors (5xx)
    if (status && status >= 500) {
      return {
        icon: <Server className="w-12 h-12 text-red-400" />,
        title: "Lỗi máy chủ",
        description: "Có sự cố xảy ra ở máy chủ. Chúng tôi đang khắc phục.",
        suggestion: "Vui lòng thử lại sau ít phút",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        buttonColor: "border-red-300 text-red-700 hover:bg-red-50",
      };
    }

    // Client errors (4xx)
    if (status && status >= 400 && status < 500) {
      return {
        icon: <AlertCircle className="w-12 h-12 text-orange-400" />,
        title: "Yêu cầu không hợp lệ",
        description: "Thông tin yêu cầu không đúng hoặc thiếu.",
        suggestion: "Vui lòng kiểm tra lại thông tin",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        buttonColor: "border-orange-300 text-orange-700 hover:bg-orange-50",
      };
    }

    // Default/Unknown errors
    return {
      icon: <Bug className="w-12 h-12 text-gray-400" />,
      title: "Đã xảy ra lỗi",
      description: error.message || "Có lỗi không xác định xảy ra.",
      suggestion: "Vui lòng thử lại hoặc liên hệ hỗ trợ",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      buttonColor: "border-gray-300 text-gray-700 hover:bg-gray-50",
    };
  };

  const errorDetails = getErrorDetails();

  return (
    <Card
      className={`${errorDetails.bgColor} ${errorDetails.borderColor} ${className}`}
    >
      <div className="p-8 text-center">
        <div className="flex justify-center mb-4">{errorDetails.icon}</div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {errorDetails.title}
        </h3>

        <p className="text-gray-600 mb-2">{errorDetails.description}</p>

        <p className="text-sm text-gray-500 mb-6">{errorDetails.suggestion}</p>

        {/* Error details for debugging */}
        {error.status && (
          <div className="text-xs text-gray-400 mb-4 font-mono">
            Mã lỗi: {error.status} {error.code && `(${error.code})`}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className={errorDetails.buttonColor}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Thử lại
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open("/lien-he", "_blank")}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Hỗ trợ
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Compact error component for smaller spaces
export function RecommendationErrorCompact({
  error,
  onRetry,
  className = "",
}: RecommendationErrorProps) {
  return (
    <div
      className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              Không thể tải gợi ý
            </p>
            <p className="text-xs text-red-600">{error.message}</p>
          </div>
        </div>

        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Thử lại
          </Button>
        )}
      </div>
    </div>
  );
}
