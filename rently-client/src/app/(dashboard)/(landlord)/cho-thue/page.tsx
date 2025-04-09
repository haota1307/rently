"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Building2, DollarSign, HomeIcon, Users } from "lucide-react";
import { useGetStatisticsOverview } from "@/features/statistics/statistics.hooks";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const LandlordPage = () => {
  const { data: statistics, isLoading } = useGetStatisticsOverview();

  const getPercentageChange = (value?: number) => {
    if (value === undefined) return "0";
    return `${value >= 0 ? "+" : ""}${value}`;
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Tổng quan</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 m-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số nhà trọ
            </CardTitle>
            <HomeIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statistics?.totalRentals || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics?.percentageChanges?.rentals)}%
                  so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số phòng trọ
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statistics?.totalRooms || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics?.percentageChanges?.rooms)}%
                  so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng số bài viết đã đăng
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {statistics?.totalPosts || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics?.percentageChanges?.posts)}%
                  so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Số dư tài khoản
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(statistics?.accountBalance || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {getPercentageChange(statistics?.percentageChanges?.balance)}%
                  so với tháng trước
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 m-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tổng quan doanh thu</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full bg-muted/20 flex items-center justify-center text-muted-foreground">
              Biểu đồ doanh thu
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Lịch sử giao dịch</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Bạn đã thanh toán phí bài đăng 10.000đ
                  </p>
                  <p className="text-sm text-muted-foreground">2 phút trước</p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Bạn đã nạp card 20.000đ - bát môn đôn giáp
                  </p>
                  <p className="text-sm text-muted-foreground">10 phút trước</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  );
};

export default LandlordPage;
