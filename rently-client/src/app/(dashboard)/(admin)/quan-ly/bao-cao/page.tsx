"use client";

import { PostReportsList } from "@/features/post-report/components";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export default function ManageReportsPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="text-lg font-semibold">Quản lý báo cáo bài đăng</h1>
      </header>
      <div className="p-4 space-y-4">
        <Card>
          <CardContent className="p-4">
            <PostReportsList />
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
}
