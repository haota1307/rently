import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Camera } from "lucide-react";

interface StatusBadgeProps {
  code: string;
  compact?: boolean;
}

const statusConfig: Record<
  string,
  {
    label: string;
    description: string;
    variant: "default" | "destructive" | "outline" | "secondary";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  "200": {
    label: "Thành công",
    description: "Xác thực khuôn mặt thành công",
    variant: "default",
    icon: CheckCircle,
  },
  "407": {
    label: "Không nhận diện được",
    description: "Không nhận dạng được khuôn mặt trong ảnh",
    variant: "destructive",
    icon: Camera,
  },
  "408": {
    label: "Định dạng sai",
    description: "Ảnh đầu vào không đúng định dạng",
    variant: "destructive",
    icon: AlertTriangle,
  },
  "409": {
    label: "Số lượng khuôn mặt",
    description: "Có nhiều hoặc ít hơn số lượng (2) khuôn mặt cần xác thực",
    variant: "destructive",
    icon: XCircle,
  },
};

export function StatusBadge({ code, compact = false }: StatusBadgeProps) {
  const config = statusConfig[code] || {
    label: `Code ${code}`,
    description: "Mã trạng thái không xác định",
    variant: "outline" as const,
    icon: AlertTriangle,
  };

  const Icon = config.icon;

  if (compact) {
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {code}
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {config.description}
      </span>
    </div>
  );
}
