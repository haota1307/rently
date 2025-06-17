"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemSettingList } from "./system-setting-list";
import { SYSTEM_SETTING_GROUPS } from "./system-setting-constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Palette,
  Mail,
  CreditCard,
  LayoutGrid,
  Settings,
  Info,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SystemSettingTabs() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="space-y-6">
      <Card className="bg-muted/30 border-dashed">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cài đặt hệ thống</CardTitle>
          </div>
          <CardDescription>
            Quản lý các cài đặt hệ thống để tùy chỉnh ứng dụng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertTitle>Lưu ý quan trọng</AlertTitle>
            <AlertDescription>
              Thay đổi các cài đặt hệ thống có thể ảnh hưởng đến hoạt động của
              ứng dụng. Hãy đảm bảo bạn hiểu rõ về cài đặt trước khi thực hiện
              thay đổi.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <div className="border-b mb-6">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground mb-4">
            <TabsTrigger
              value="all"
              className="px-4 py-2 flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              <span>Tất cả</span>
            </TabsTrigger>
            <TabsTrigger
              value={SYSTEM_SETTING_GROUPS.INTERFACE}
              className="px-4 py-2 flex items-center gap-2"
            >
              <Palette className="h-4 w-4" />
              <span>Giao diện</span>
            </TabsTrigger>
            <TabsTrigger
              value={SYSTEM_SETTING_GROUPS.EMAIL}
              className="px-4 py-2 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              <span>Mẫu Email</span>
            </TabsTrigger>
            <TabsTrigger
              value={SYSTEM_SETTING_GROUPS.PRICING}
              className="px-4 py-2 flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span>Giá dịch vụ</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="all"
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <SystemSettingList />
        </TabsContent>

        <TabsContent
          value={SYSTEM_SETTING_GROUPS.INTERFACE}
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <SystemSettingList group={SYSTEM_SETTING_GROUPS.INTERFACE} />
        </TabsContent>

        <TabsContent
          value={SYSTEM_SETTING_GROUPS.EMAIL}
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <SystemSettingList group={SYSTEM_SETTING_GROUPS.EMAIL} />
        </TabsContent>

        <TabsContent
          value={SYSTEM_SETTING_GROUPS.PRICING}
          className="focus-visible:outline-none focus-visible:ring-0"
        >
          <SystemSettingList group={SYSTEM_SETTING_GROUPS.PRICING} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
