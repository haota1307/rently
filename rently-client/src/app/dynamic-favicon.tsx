"use client";

import { useEffect } from "react";
import { useUiSettings } from "@/features/system-setting/hooks/useUiSettings";

export function DynamicFavicon() {
  const { settings, isLoading, defaultSettings } = useUiSettings();

  useEffect(() => {
    // Nếu đang loading, không làm gì cả
    if (isLoading) return;

    // Chỉ cập nhật favicon khi có giá trị và đã tải xong
    if (!settings.siteFavicon) return;

    // Tìm link favicon hiện tại hoặc tạo mới
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    // Cập nhật href cho favicon
    link.href = settings.siteFavicon;
  }, [settings.siteFavicon, isLoading]);

  // Component này không render bất kỳ thứ gì
  return null;
}
