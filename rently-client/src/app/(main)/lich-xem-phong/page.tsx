"use client";

import { ViewingScheduleList } from "@/components/viewing-schedule/viewing-schedule-list";
import { useAppStore } from "@/components/app-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function ViewingSchedulePage() {
  // const isAuth = useAppStore((state) => state.isAuth);
  // const router = useRouter();

  // // Kiểm tra người dùng đã đăng nhập chưa
  // useEffect(() => {
  //   if (!isAuth) {
  //     router.push("/dang-nhap?callback=/lich-xem-phong");
  //   }
  // }, [isAuth, router]);

  // // Nếu chưa đăng nhập, không hiển thị nội dung
  // if (!isAuth) {
  //   return null;
  // }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Lịch Xem Phòng</CardTitle>
        </CardHeader>
      </Card>
      <div className="mt-4">
        <ViewingScheduleList />
      </div>
    </div>
  );
}
