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

export function DashboardLogo() {
  const { settings, isLoading, defaultSettings } = useUiSettings();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/" className="flex items-center justify-center">
          <SidebarMenuButton
            size="lg"
            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            {isLoading ? (
              <div className="flex aspect-square w-8 h-8 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : settings.siteLogo.endsWith(".svg") ||
              settings.siteLogo.endsWith(".png") ||
              settings.siteLogo.endsWith(".jpg") ? (
              <div className="flex aspect-square w-8 h-8 items-center justify-center">
                <Image
                  src={settings.siteLogo}
                  alt="Rently Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
              </div>
            ) : (
              <div className="flex aspect-square w-8 h-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <HomeIcon className="w-4 h-4" />
              </div>
            )}
            <h2 className="font-black tracking-wider uppercase text-2xl text-primary">
              Rently
            </h2>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
