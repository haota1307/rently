"use client";

import { useEffect } from "react";
import { useUiSettings } from "@/features/system-setting/hooks/useUiSettings";

export function DynamicMetadata() {
  const { settings, isLoading } = useUiSettings();

  useEffect(() => {
    if (!isLoading) {
      // Cập nhật tiêu đề trang web
      document.title = settings.siteName || "Rently - Tìm phòng trọ dễ dàng";

      // Cập nhật mô tả trang web
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          settings.siteDescription || "Nền tảng kết nối chủ trọ và người thuê"
        );
      } else {
        const newMetaDescription = document.createElement("meta");
        newMetaDescription.setAttribute("name", "description");
        newMetaDescription.setAttribute(
          "content",
          settings.siteDescription || "Nền tảng kết nối chủ trọ và người thuê"
        );
        document.head.appendChild(newMetaDescription);
      }
    }
  }, [isLoading, settings.siteName, settings.siteDescription]);

  return null;
}
