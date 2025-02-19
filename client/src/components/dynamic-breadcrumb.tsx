"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Giả sử các component này được export từ thư mục ui của shadcn UI
import { Slash } from "lucide-react";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  // Tách các phần trong URL, loại bỏ phần rỗng (ví dụ: "/" sẽ thành [])
  const segments = pathname.split("/").filter(Boolean);

  // Đối tượng ánh xạ các segment sang tiếng Việt
  const translations: { [key: string]: string } = {
    components: "Thành phần",
    products: "Sản phẩm",
    about: "Giới thiệu",
    contact: "Liên hệ",
    listings: "Phòng trọ",
  };

  // Hàm tạo đường dẫn cộng dồn cho từng segment.
  const generatePath = (index: number) =>
    "/" + segments.slice(0, index + 1).join("/");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Trang chủ</BreadcrumbLink>
        </BreadcrumbItem>
        {segments.map((segment, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator>
              <Slash />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink href={generatePath(index)}>
                {translations[segment] ||
                  segment.charAt(0).toUpperCase() + segment.slice(1)}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
