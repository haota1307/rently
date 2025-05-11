"use client";

import React, { useEffect, useState } from "react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";

export const NotificationPopover = () => {
  const { unreadCount } = useNotificationSocket();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [open, setOpen] = useState(false);

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

  // Đóng popover khi chuyển trang trên mobile
  useEffect(() => {
    return () => {
      setOpen(false);
    };
  }, [router]);

  // Nội dung thông báo (dùng chung cho cả Popover và Sheet)
  const NotificationContent = () => (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b p-3 sm:p-4 bg-gradient-to-r from-muted/60 to-muted/20 gap-2">
        <h3 className="font-semibold flex items-center gap-2 text-base sm:text-lg">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" /> Thông báo
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
              className="text-xs h-8 sm:h-9 p-2 flex items-center gap-1 hover:bg-primary/10"
              disabled={isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Đánh dấu đã đọc</span>
              <span className="sm:hidden">Đọc tất cả</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 sm:h-9 text-xs font-medium p-2 bg-background hover:bg-primary/10 hover:text-primary"
            onClick={() => {
              router.push("/lich-xem-phong");
              setOpen(false);
            }}
          >
            <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Xem tất cả</span>
            <span className="sm:hidden">Tất cả</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
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
      ) : (
        <>
          <NotificationList
            notifications={data?.payload?.data || []}
            isLoading={false}
          />
        </>
      )}
    </>
  );

  // Render Popover cho desktop và Sheet cho mobile
  return isMobile ? (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-muted focus-visible:bg-muted"
          aria-label="Thông báo"
        >
          <Bell className="h-5 w-5 rotate-0 scale-100 transition-all text-muted-foreground" />
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
      </SheetTrigger>
      <SheetContent side="right" className="p-0 w-full sm:max-w-sm">
        <NotificationContent />
      </SheetContent>
    </Sheet>
  ) : (
    <Popover open={open} onOpenChange={setOpen}>
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
        className="w-[350px] sm:w-[450px] z-[99999] p-0 shadow-lg border border-border/40 rounded-xl"
        align="end"
        sideOffset={5}
      >
        <NotificationContent />
      </PopoverContent>
    </Popover>
  );
};
