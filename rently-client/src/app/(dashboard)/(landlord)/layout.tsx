import type React from "react";

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/dashboard/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
