"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SystemSettingList } from "./system-setting-list";
import { SYSTEM_SETTING_GROUPS } from "./system-setting-constants";
import { Card } from "@/components/ui/card";

export function SystemSettingTabs() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
      <div className="border-b mb-4">
        <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground mb-4">
          <TabsTrigger value="all" className="px-3">
            Tất cả
          </TabsTrigger>
          <TabsTrigger value={SYSTEM_SETTING_GROUPS.INTERFACE} className="px-3">
            Giao diện
          </TabsTrigger>
          <TabsTrigger value={SYSTEM_SETTING_GROUPS.EMAIL} className="px-3">
            Mẫu Email
          </TabsTrigger>
          <TabsTrigger value={SYSTEM_SETTING_GROUPS.PRICING} className="px-3">
            Giá dịch vụ
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="all">
        <SystemSettingList />
      </TabsContent>

      <TabsContent value={SYSTEM_SETTING_GROUPS.INTERFACE}>
        <SystemSettingList group={SYSTEM_SETTING_GROUPS.INTERFACE} />
      </TabsContent>

      <TabsContent value={SYSTEM_SETTING_GROUPS.EMAIL}>
        <SystemSettingList group={SYSTEM_SETTING_GROUPS.EMAIL} />
      </TabsContent>

      <TabsContent value={SYSTEM_SETTING_GROUPS.PRICING}>
        <SystemSettingList group={SYSTEM_SETTING_GROUPS.PRICING} />
      </TabsContent>
    </Tabs>
  );
}
