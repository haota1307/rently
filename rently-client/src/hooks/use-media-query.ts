"use client";

import { useEffect, useState } from "react";

/**
 * Hook để theo dõi media query trên client-side
 * @param query Media query string (ví dụ: "(max-width: 768px)")
 * @returns Boolean cho biết media query có khớp hay không
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // Chỉ chạy trên client-side
    if (typeof window === "undefined") return;

    // Kiểm tra ban đầu
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    // Cập nhật trạng thái khi có thay đổi
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Đăng ký listener
    mediaQuery.addEventListener("change", handleChange);

    // Cleanup listener khi component unmount
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}
