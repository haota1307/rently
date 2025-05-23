"use client";

import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Notification, NotificationType } from "@/schemas/notification.schema";
import { useRouter } from "next/navigation";
import { useNotificationSocket } from "./notification-socket-provider";
import { formatDistanceToNow, isToday, isYesterday, format } from "date-fns";
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
  CheckIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { createPostSlug } from "@/lib/utils";

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

    // Điều hướng dựa vào loại thông báo
    switch (notification.type) {
      case NotificationType.PAYMENT:
        if (notification.deepLink) {
          router.push(notification.deepLink);
        } else {
          router.push("/nap-tien");
        }
        break;
      case NotificationType.VIEWING_SCHEDULE:
        router.push("/lich-xem-phong");
        break;
      case NotificationType.RENTAL_REQUEST:
        if (notification.deepLink) {
          router.push(notification.deepLink);
        } else {
          router.push("/thue-phong");
        }
        break;
      case NotificationType.INTERACTION:
        // Nếu là tin nhắn
        if (
          notification.relatedType === "conversation" &&
          notification.relatedId
        ) {
          router.push(`/tin-nhan/${notification.relatedId}`);
        }
        // Nếu là bình luận
        else if (
          notification.relatedType === "post" &&
          notification.relatedId
        ) {
          // Tạo slug từ title và ID
          const postTitle = notification.title || "bai-dang";
          const slug = createPostSlug(postTitle, notification.relatedId);
          router.push(`/bai-dang/${slug}`);
        }
        break;
      case NotificationType.POST:
        if (notification.relatedId) {
          // Tạo slug từ title và ID
          const postTitle = notification.title || "bai-dang";
          const slug = createPostSlug(postTitle, notification.relatedId);
          router.push(`/bai-dang/${slug}`);
        }
        break;
      default:
        // Có deepLink thì vẫn dùng
        if (notification.deepLink) {
          router.push(notification.deepLink);
        }
    }
  };

  // Icon cho từng loại thông báo
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.PAYMENT:
        return <CreditCardIcon className="h-4 w-4 sm:h-6 sm:w-6" />;
      case NotificationType.INTERACTION:
        return <MessageCircleIcon className="h-4 w-4 sm:h-6 sm:w-6" />;
      case NotificationType.RENTAL_REQUEST:
        return <HomeIcon className="h-4 w-4 sm:h-6 sm:w-6" />;
      case NotificationType.VIEWING_SCHEDULE:
        return <CalendarIcon className="h-4 w-4 sm:h-6 sm:w-6" />;
      case NotificationType.POST:
        return <HeartIcon className="h-4 w-4 sm:h-6 sm:w-6" />;
      case NotificationType.SYSTEM:
      default:
        return <BellIcon className="h-4 w-4 sm:h-6 sm:w-6" />;
    }
  };

  // Nhóm thông báo theo ngày
  const groupNotificationsByDate = (
    notifications: Notification[]
  ): { [key: string]: Notification[] } => {
    const groups: { [key: string]: Notification[] } = {};

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      let key = "";

      if (isToday(date)) {
        key = "Hôm nay";
      } else if (isYesterday(date)) {
        key = "Hôm qua";
      } else {
        key = format(date, "dd/MM/yyyy");
      }

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(notification);
    });

    return groups;
  };

  if (isLoading) {
    return (
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-2 sm:gap-3">
            <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
            <div className="space-y-1 sm:space-y-2 flex-1">
              <Skeleton className="h-4 sm:h-5 w-32 sm:w-40" />
              <Skeleton className="h-3 sm:h-4 w-full" />
              <Skeleton className="h-3 sm:h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center text-muted-foreground">
        <BellIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 opacity-50" />
        <p className="text-base sm:text-lg font-medium">
          Không có thông báo nào
        </p>
        <p className="text-xs sm:text-sm mt-1 sm:mt-2">
          Thông báo mới sẽ xuất hiện ở đây
        </p>
      </div>
    );
  }

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <ScrollArea className="h-[60vh] max-h-[450px]">
      <div className="p-1 sm:p-2">
        {Object.entries(groupedNotifications).map(([date, items]) => (
          <div key={date} className="mb-2 sm:mb-3">
            <div className="sticky top-0 z-10 bg-background px-3 sm:px-4 py-1.5 sm:py-2 border-b mb-1 sm:mb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {date}
              </p>
            </div>
            <div className="space-y-1.5 sm:space-y-2 py-1">
              {items.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "px-3 sm:px-5 py-3 sm:py-4 mx-1 sm:mx-2 rounded-xl cursor-pointer flex gap-2 sm:gap-4 transition-all hover:bg-muted hover:shadow-sm",
                    !notification.isRead
                      ? "bg-muted/50 border-l-3 border-primary shadow-sm"
                      : "bg-background border border-border/30"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div
                    className={cn(
                      "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                      getIconColorByType(notification.type)
                    )}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm sm:text-base font-semibold leading-tight line-clamp-1 mr-2">
                        {notification.title}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: vi,
                        })}
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center mt-2 sm:mt-3">
                      {(notification.type === NotificationType.PAYMENT ||
                        notification.type ===
                          NotificationType.VIEWING_SCHEDULE ||
                        (notification.type ===
                          NotificationType.RENTAL_REQUEST &&
                          notification.relatedId) ||
                        (notification.type === NotificationType.INTERACTION &&
                          notification.relatedId) ||
                        (notification.type === NotificationType.POST &&
                          notification.relatedId) ||
                        !!notification.deepLink) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-3 rounded-full text-primary hover:bg-primary/10 hover:text-primary font-medium"
                        >
                          Xem chi tiết
                          <ArrowRightIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1" />
                        </Button>
                      )}
                      {!notification.isRead ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Mới
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] sm:text-xs text-muted-foreground">
                          <CheckIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-0.5 sm:mr-1" />{" "}
                          Đã đọc
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
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
      return "bg-gradient-to-br from-green-100 to-green-50 text-green-600 border border-green-200";
    case NotificationType.INTERACTION:
      return "bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 border border-blue-200";
    case NotificationType.RENTAL_REQUEST:
      return "bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600 border border-purple-200";
    case NotificationType.VIEWING_SCHEDULE:
      return "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 border border-amber-200";
    case NotificationType.POST:
      return "bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600 border border-pink-200";
    case NotificationType.SYSTEM:
    default:
      return "bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 border border-gray-200";
  }
};
