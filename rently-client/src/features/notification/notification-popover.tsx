"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, CheckCheck, ExternalLink } from "lucide-react";
import { useNotificationSocket } from "./notification-socket-provider";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import notificationApiRequest from "./notification.api";
import { NotificationList } from "@/features/notification/notification-list";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export const NotificationPopover = () => {
  const { unreadCount } = useNotificationSocket();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Lấy danh sách thông báo từ API
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      notificationApiRequest.getNotifications({ page: 1, limit: 15 }),
  });

  // Mutation để đánh dấu đã đọc tất cả
  const { mutate: markAllAsRead, isPending } = useMutation({
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
          className="relative hover:bg-muted focus-visible:bg-muted"
          aria-label="Thông báo"
        >
          <Bell className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all text-muted-foreground" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] ring-1 ring-background animate-pulse",
                unreadCount > 9 && "text-[8px]" // Giảm font size nếu có nhiều thông báo
              )}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[450px] p-0 shadow-lg border border-border/40 rounded-xl"
        align="end"
        sideOffset={5}
      >
        <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-muted/60 to-muted/20">
          <h3 className="font-semibold flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" /> Thông báo
            {unreadCount > 0 && (
              <Badge variant="secondary" className="font-normal text-xs">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </h3>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs h-9 flex items-center gap-1 hover:bg-primary/10"
                disabled={isPending}
              >
                <CheckCheck className="h-4 w-4" />
                <span>Đánh dấu đã đọc</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs font-medium bg-background hover:bg-primary/10 hover:text-primary"
              onClick={() => router.push("/lich-xem-phong")}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Xem tất cả
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <NotificationList
              notifications={data?.payload?.data || []}
              isLoading={false}
            />

            {data?.payload?.data?.length === 0 && (
              <div className="p-12 text-center">
                <div className="bg-muted/40 p-5 rounded-full inline-flex items-center justify-center mb-4 shadow-sm">
                  <BellOff className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">Không có thông báo</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Bạn sẽ nhận thông báo khi có lịch hẹn, tin nhắn hoặc yêu cầu
                  mới
                </p>
              </div>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
