"use client";

import { useEffect } from "react";
import { globalBodyStyleCleanup } from "@/hooks/useBodyStyleCleanup";

interface BodyStyleCleanupProviderProps {
  children: React.ReactNode;
  /**
   * Interval để check body styles (ms)
   * Default: 2000ms (2 giây)
   */
  checkInterval?: number;
}

/**
 * Provider component để tự động cleanup body styles toàn cục
 * Wrap component này ở root level để tự động fix lỗi pointer-events: none
 */
export const BodyStyleCleanupProvider: React.FC<
  BodyStyleCleanupProviderProps
> = ({ children, checkInterval = 2000 }) => {
  useEffect(() => {
    // Periodic check và cleanup
    const checkBodyStyles = () => {
      // Chỉ cleanup nếu không có dialog nào đang mở
      // Kiểm tra data attributes để xác định trạng thái dialog
      const hasRadixDialog = document.querySelector(
        "[data-radix-dialog-overlay]"
      );
      const hasAriaModal = document.querySelector('[aria-modal="true"]');

      if (
        !hasRadixDialog &&
        !hasAriaModal &&
        document.body.style.pointerEvents === "none"
      ) {
        globalBodyStyleCleanup();
      }
    };

    // Listen cho ESC key để force cleanup
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Delay để cho phép dialog close trước
        setTimeout(() => {
          const hasRadixDialog = document.querySelector(
            "[data-radix-dialog-overlay]"
          );
          const hasAriaModal = document.querySelector('[aria-modal="true"]');

          if (!hasRadixDialog && !hasAriaModal) {
            globalBodyStyleCleanup();
          }
        }, 200);
      }
    };

    // Listen cho click events để detect stuck states
    const handleGlobalClick = () => {
      setTimeout(() => {
        const hasRadixDialog = document.querySelector(
          "[data-radix-dialog-overlay]"
        );
        const hasAriaModal = document.querySelector('[aria-modal="true"]');

        if (
          !hasRadixDialog &&
          !hasAriaModal &&
          document.body.style.pointerEvents === "none"
        ) {
          globalBodyStyleCleanup();
        }
      }, 300);
    };

    const interval = setInterval(checkBodyStyles, checkInterval);
    document.addEventListener("keydown", handleGlobalKeyDown);
    document.addEventListener("click", handleGlobalClick, true);

    return () => {
      clearInterval(interval);
      document.removeEventListener("keydown", handleGlobalKeyDown);
      document.removeEventListener("click", handleGlobalClick, true);
      // Final cleanup
      globalBodyStyleCleanup();
    };
  }, [checkInterval]);

  return <>{children}</>;
};

/**
 * Hook để manual trigger cleanup từ bất kỳ component nào
 */
export const useManualCleanup = () => {
  return {
    cleanup: globalBodyStyleCleanup,
    cleanupDelayed: (delay: number = 100) => {
      setTimeout(globalBodyStyleCleanup, delay);
    },
  };
};
