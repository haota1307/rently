"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { BellIcon } from "lucide-react";
import { useNotificationSocket } from "./notification-socket-provider";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import notificationApiRequest from "./notification.api";
import { NotificationList } from "@/features/notification/notification-list";

export const NotificationPopover = () => {
  const { unreadCount } = useNotificationSocket();
  const queryClient = useQueryClient();

  // Lấy danh sách thông báo từ API
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      notificationApiRequest.getNotifications({ page: 1, limit: 10 }),
  });

  // Mutation để đánh dấu đã đọc tất cả
  const { mutate: markAllAsRead } = useMutation({
    mutationFn: notificationApiRequest.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadNotificationCount"] });
    },
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Thông báo"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]",
                unreadCount > 9 && "text-[8px]" // Giảm font size nếu có nhiều thông báo
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-3">
          <h3 className="font-medium">Thông báo</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="text-xs h-8"
            >
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        <NotificationList
          notifications={data?.payload?.data || []}
          isLoading={isLoading}
        />
      </PopoverContent>
    </Popover>
  );
};
