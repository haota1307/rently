import React, { useEffect, useCallback } from "react";

/**
 * Custom hook để cleanup body styles bị stuck từ Radix UI dialogs
 * Giải quyết vấn đề pointer-events: none và overflow: hidden bị stuck trên body element
 */
export const useBodyStyleCleanup = (dialogStates: boolean[] = []) => {
  // Force cleanup body styles function
  const forceCleanupBodyStyles = useCallback(() => {
    try {
      // Remove pointer-events: none from body
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = "";
      }

      // Remove any overflow hidden that might be stuck
      if (document.body.style.overflow === "hidden") {
        document.body.style.overflow = "";
      }

      // Check if any dialogs are supposed to be open
      const hasOpenDialog = dialogStates.some((state) => state === true);

      if (!hasOpenDialog) {
        // Remove any Radix portal attributes that might be stuck
        document.body.removeAttribute("data-scroll-locked");
        document.body.removeAttribute("data-radix-scroll-locked");

        // Force re-enable pointer events temporarily
        document.body.style.pointerEvents = "auto";
        setTimeout(() => {
          if (
            !document.body.style.pointerEvents ||
            document.body.style.pointerEvents === "auto"
          ) {
            document.body.style.pointerEvents = "";
          }
        }, 50);
      }
    } catch (error) {
      console.warn("Error cleaning up body styles:", error);
    }
  }, [dialogStates]);

  // Main effect for cleanup and monitoring
  useEffect(() => {
    // Check and fix stuck body styles periodically
    const checkBodyStyles = () => {
      const hasOpenDialog = dialogStates.some((state) => state === true);
      if (!hasOpenDialog && document.body.style.pointerEvents === "none") {
        forceCleanupBodyStyles();
      }
    };

    // Listen for ESC key to force cleanup if stuck
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        const hasOpenDialog = dialogStates.some((state) => state === true);
        if (!hasOpenDialog) {
          setTimeout(forceCleanupBodyStyles, 100);
        }
      }
    };

    // Listen for clicks to detect potential stuck states
    const handleClick = () => {
      const hasOpenDialog = dialogStates.some((state) => state === true);
      if (!hasOpenDialog && document.body.style.pointerEvents === "none") {
        setTimeout(forceCleanupBodyStyles, 200);
      }
    };

    const interval = setInterval(checkBodyStyles, 1000); // Check every second
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", handleClick, true);

    return () => {
      clearInterval(interval);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", handleClick, true);
      forceCleanupBodyStyles();
    };
  }, [dialogStates, forceCleanupBodyStyles]);

  // Return the cleanup function for manual use
  return {
    forceCleanup: forceCleanupBodyStyles,
    // Utility function to be called when closing dialogs
    cleanupOnClose: useCallback(() => {
      setTimeout(forceCleanupBodyStyles, 100);
    }, [forceCleanupBodyStyles]),
  };
};

/**
 * Simplified version for single dialog state
 */
export const useDialogCleanup = (isOpen: boolean) => {
  return useBodyStyleCleanup([isOpen]);
};

/**
 * Global cleanup function có thể gọi từ bất kỳ đâu
 */
export const globalBodyStyleCleanup = () => {
  try {
    // Remove pointer-events: none from body
    if (document.body.style.pointerEvents === "none") {
      document.body.style.pointerEvents = "";
    }

    // Remove any overflow hidden that might be stuck
    if (document.body.style.overflow === "hidden") {
      document.body.style.overflow = "";
    }

    // Remove any Radix portal attributes that might be stuck
    document.body.removeAttribute("data-scroll-locked");
    document.body.removeAttribute("data-radix-scroll-locked");

    // Force re-enable pointer events temporarily
    document.body.style.pointerEvents = "auto";
    setTimeout(() => {
      if (
        !document.body.style.pointerEvents ||
        document.body.style.pointerEvents === "auto"
      ) {
        document.body.style.pointerEvents = "";
      }
    }, 50);
  } catch (error) {
    console.warn("Error cleaning up body styles:", error);
  }
};
