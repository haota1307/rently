import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Building2, DollarSign, HomeIcon, Users } from "lucide-react";

const DashboardPage = () => {
  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-base md:text-lg font-semibold">Tổng quan</h1>
      </header>

      <div className="p-2 md:p-4 space-y-4 overflow-y-auto overflow-x-hidden">
        <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Tổng người dùng
              </CardTitle>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% so với tháng trước
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Người cho thuê
              </CardTitle>
              <Building2 className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">324</div>
              <p className="text-xs text-muted-foreground">
                +8% so với tháng trước
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Phòng trọ
              </CardTitle>
              <HomeIcon className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">2,543</div>
              <p className="text-xs text-muted-foreground">
                +18% so với tháng trước
              </p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium">
                Doanh thu
              </CardTitle>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">45,231,000đ</div>
              <p className="text-xs text-muted-foreground">
                +4% so với tháng trước
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-1 lg:grid-cols-7">
          <Card className="lg:col-span-4 overflow-hidden shadow-sm">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-sm md:text-base">
                Tổng quan doanh thu
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="h-[200px] md:h-[300px] w-full bg-muted/20 flex items-center justify-center text-xs md:text-sm text-muted-foreground rounded-sm">
                Biểu đồ doanh thu
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3 overflow-hidden shadow-sm">
            <CardHeader className="p-3 md:p-6">
              <CardTitle className="text-sm md:text-base">
                Hoạt động gần đây
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium leading-none">
                      Nguyễn Văn A đã đăng ký tài khoản mới
                    </p>
                    <p className="text-xs text-muted-foreground">
                      2 phút trước
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium leading-none">
                      Trần Thị B đã đăng phòng trọ mới
                    </p>
                    <p className="text-xs text-muted-foreground">
                      15 phút trước
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium leading-none">
                      Lê Văn C đã thanh toán dịch vụ
                    </p>
                    <p className="text-xs text-muted-foreground">1 giờ trước</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="space-y-1">
                    <p className="text-xs md:text-sm font-medium leading-none">
                      Phạm Thị D đã nâng cấp tài khoản
                    </p>
                    <p className="text-xs text-muted-foreground">3 giờ trước</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
};

export default DashboardPage;
