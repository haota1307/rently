import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ViewingScheduleList } from "@/features/viewing-schedule/components/viewing-schedule-list";

export function ViewingScheduleTab() {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <Card>
      <CardHeader className="border-b bg-muted/40">
        <CardTitle className="text-xl">Lịch xem phòng</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs
          defaultValue="all"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 mb-8">
            <TabsTrigger value="all">Tất cả</TabsTrigger>
            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
            <TabsTrigger value="approved">Đã duyệt</TabsTrigger>
            <TabsTrigger value="rejected">Từ chối</TabsTrigger>
            <TabsTrigger value="rescheduled">Đã đổi lịch</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab}>
            <ViewingScheduleList initialTab={activeTab} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
