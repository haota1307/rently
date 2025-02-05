"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import { BarChart, Bar, CartesianGrid, XAxis } from "recharts";

// Dữ liệu biểu đồ: tỉ lệ đặt phòng thành công theo tháng (số liệu mẫu)
const chartData = [
  { month: "January", success: 75 },
  { month: "February", success: 80 },
  { month: "March", success: 70 },
  { month: "April", success: 85 },
  { month: "May", success: 90 },
  { month: "June", success: 80 },
];

// Cấu hình cho biểu đồ (định nghĩa nhãn và màu)
const chartConfig = {
  success: {
    label: "Tỉ lệ đặt phòng thành công",
    color: "hsl(var(--chart-3))", // Sử dụng biến CSS đã định nghĩa cho màu, hoặc thay đổi theo ý bạn
  },
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Grid cho các card thống kê */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Card: Tổng Listing */}
        <Card className="bg-card text-card-foreground shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tổng Bài viết</CardTitle>
            <CardDescription className="text-xs">
              +12% so với tháng trước
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">365/1,264</div>
            <div className="text-3xl font-bold"></div>
          </CardContent>
        </Card>

        {/* Card: Doanh Thu */}
        <Card className="bg-card text-card-foreground shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Doanh Thu</CardTitle>
            <CardDescription className="text-xs">
              +8% so với tháng trước
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">13,700,000</div>
          </CardContent>
        </Card>

        {/* Card: Người Dùng */}
        <Card className="bg-card text-card-foreground shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Người Dùng</CardTitle>
            <CardDescription className="text-xs">
              +5% so với tháng trước
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">823</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Biểu đồ đặt phòng thành công */}
        <Card className="bg-card text-card-foreground shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Biểu đồ tỉ lệ đặt phòng thành công
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="min-h-[200px] w-full"
            >
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="success" fill="var(--color-success)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground shadow">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Biểu đồ tỉ lệ đặt phòng thành công
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfig}
              className="min-h-[200px] w-full"
            >
              <BarChart accessibilityLayer data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="success" fill="var(--color-success)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
