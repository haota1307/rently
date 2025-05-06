"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Notification, NotificationType } from "@/schemas/notification.schema";
import { useRouter } from "next/navigation";
import { useNotificationSocket } from "./notification-socket-provider";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import notificationApiRequest from "./notification.api";
import { cn } from "@/lib/utils";
import {
  BellIcon,
  MessageCircleIcon,
  CalendarIcon,
  HeartIcon,
  HomeIcon,
  CreditCardIcon,
} from "lucide-react";

interface NotificationListProps {
  notifications: Notification[];
  isLoading: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  isLoading,
}) => {
  const router = useRouter();
  const { markAsRead } = useNotificationSocket();
  const queryClient = useQueryClient();

  // Mutation để đánh dấu thông báo đã đọc
  const { mutate } = useMutation({
    mutationFn: notificationApiRequest.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    // Đánh dấu đã đọc
    if (!notification.isRead) {
      mutate(notification.id);
      markAsRead(notification.id);
    }

    // Điều hướng nếu có deepLink
    if (notification.deepLink) {
      router.push(notification.deepLink);
    }
  };

  // Icon cho từng loại thông báo
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.PAYMENT:
        return <CreditCardIcon className="h-4 w-4" />;
      case NotificationType.INTERACTION:
        return <MessageCircleIcon className="h-4 w-4" />;
      case NotificationType.RENTAL_REQUEST:
        return <HomeIcon className="h-4 w-4" />;
      case NotificationType.VIEWING_SCHEDULE:
        return <CalendarIcon className="h-4 w-4" />;
      case NotificationType.POST:
        return <HeartIcon className="h-4 w-4" />;
      case NotificationType.SYSTEM:
      default:
        return <BellIcon className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-60" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <BellIcon className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p>Không có thông báo nào</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[60vh] max-h-[400px]">
      <div className="space-y-0">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => handleNotificationClick(notification)}
            className={cn(
              "p-4 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors flex gap-3",
              !notification.isRead && "bg-muted/30"
            )}
          >
            <div
              className={cn(
                "p-2 rounded-full flex items-center justify-center",
                getIconColorByType(notification.type)
              )}
            >
              {getNotificationIcon(notification.type)}
            </div>
            <div>
              <h4 className="text-sm font-medium leading-none">
                {notification.title}
              </h4>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: vi,
                })}
              </p>
            </div>
            {!notification.isRead && (
              <div className="ml-auto">
                <div className="h-2 w-2 rounded-full bg-destructive" />
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

// Helper để xác định màu icon dựa trên loại thông báo
const getIconColorByType = (type: NotificationType): string => {
  switch (type) {
    case NotificationType.PAYMENT:
      return "bg-green-100 text-green-600";
    case NotificationType.INTERACTION:
      return "bg-blue-100 text-blue-600";
    case NotificationType.RENTAL_REQUEST:
      return "bg-purple-100 text-purple-600";
    case NotificationType.VIEWING_SCHEDULE:
      return "bg-orange-100 text-orange-600";
    case NotificationType.POST:
      return "bg-pink-100 text-pink-600";
    case NotificationType.SYSTEM:
    default:
      return "bg-gray-100 text-gray-600";
  }
};
