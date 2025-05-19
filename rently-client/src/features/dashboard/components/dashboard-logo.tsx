"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { HomeIcon } from "lucide-react";
import { useUiSettings } from "@/features/system-setting/hooks/useUiSettings";
import { cn } from "@/lib/utils";

export function DashboardLogo() {
  const { settings, isLoading } = useUiSettings();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/" className="w-full">
          <SidebarMenuButton
            size="lg"
            className="w-full hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground transition-all duration-300"
          >
            {isLoading ? (
              <div className="flex aspect-square w-9 h-9 items-center justify-center rounded-md bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : settings.siteLogo.endsWith(".svg") ||
              settings.siteLogo.endsWith(".png") ||
              settings.siteLogo.endsWith(".jpg") ? (
              <div className="flex aspect-square w-10 h-10 items-center justify-center p-1 bg-primary/10 rounded-xl">
                <Image
                  src={settings.siteLogo}
                  alt="Rently Logo"
                  width={36}
                  height={36}
                  className="h-8 w-auto object-contain drop-shadow-sm"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-10 h-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/90 to-primary/70 text-white shadow-sm">
                <HomeIcon className="w-5 h-5" />
              </div>
            )}

            <div className="flex flex-col items-start ml-2">
              <h2
                className={cn(
                  "text-xl font-bold tracking-tight text-primary dark:text-primary relative",
                  "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0",
                  "after:bg-primary after:transition-all after:duration-300",
                  "group-hover:after:w-full"
                )}
              >
                RENTLY
              </h2>
              <span className="text-xs text-muted-foreground font-medium">
                Nền tảng cho thuê trọ
              </span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
