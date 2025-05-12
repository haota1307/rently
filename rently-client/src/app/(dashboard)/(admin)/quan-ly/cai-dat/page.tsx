"use client";

import React from "react";
import { SystemSettingTabs } from "@/features/system-setting/components/system-setting-tabs";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export default function SystemSettingsPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Cài đặt hệ thống</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground mb-4">
              Quản lý các cài đặt hệ thống: giao diện, mẫu email, và giá dịch
              vụ. Lựa chọn từ các mẫu có sẵn hoặc tạo mới theo nhu cầu.
            </p>
            <SystemSettingTabs />
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
