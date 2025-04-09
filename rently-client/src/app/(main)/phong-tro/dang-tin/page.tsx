import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

export const metadata: Metadata = {
  title: "Đăng tin cho thuê - Thuê Trọ",
  description:
    "Đăng tin cho thuê phòng trọ, căn hộ của bạn để tiếp cận hàng ngàn người thuê tiềm năng.",
};

export default function PostListingPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại trang chủ
        </Link>
      </div>

      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Đăng tin cho thuê</CardTitle>
            <CardDescription>
              Điền đầy đủ thông tin để đăng tin cho thuê phòng trọ của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Thông tin cơ bản</h3>

                <div className="grid gap-2">
                  <Label htmlFor="title">Tiêu đề</Label>
                  <Input id="title" placeholder="Nhập tiêu đề tin đăng" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả chi tiết</Label>
                  <Textarea
                    id="description"
                    placeholder="Mô tả chi tiết về phòng trọ của bạn"
                    rows={5}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="price" className="text-sm font-medium">
                      Giá phòng (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      pattern="[0-9]*"
                      id="price"
                      placeholder="Nhập giá phòng"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        // Xử lý onChange tùy theo logic của bạn
                      }}
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor="area" className="text-sm font-medium">
                      Diện tích (m²) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      pattern="[0-9]*"
                      id="area"
                      placeholder="Ví dụ: 25"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        // Xử lý onChange tùy theo logic của bạn
                      }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deposit">Tiền đặt cọc</Label>
                    <Input id="deposit" placeholder="Ví dụ: 1 tháng" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="available-date">Ngày có thể dọn vào</Label>
                    <Input id="available-date" type="date" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Địa chỉ</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Tỉnh/Thành phố</Label>
                    <Select>
                      <SelectTrigger id="city">
                        <SelectValue placeholder="Chọn tỉnh/thành phố" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hanoi">Hà Nội</SelectItem>
                        <SelectItem value="hcm">TP. Hồ Chí Minh</SelectItem>
                        <SelectItem value="danang">Đà Nẵng</SelectItem>
                        <SelectItem value="cantho">Cần Thơ</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="district">Quận/Huyện</Label>
                    <Select>
                      <SelectTrigger id="district">
                        <SelectValue placeholder="Chọn quận/huyện" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quan1">Quận 1</SelectItem>
                        <SelectItem value="quan2">Quận 2</SelectItem>
                        <SelectItem value="quan3">Quận 3</SelectItem>
                        <SelectItem value="quan4">Quận 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address">Địa chỉ cụ thể</Label>
                  <Input
                    id="address"
                    placeholder="Số nhà, tên đường, phường/xã"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Tiện ích</h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="wifi" />
                    <label htmlFor="wifi" className="text-sm">
                      Wi-Fi
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="ac" />
                    <label htmlFor="ac" className="text-sm">
                      Điều hòa
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="parking" />
                    <label htmlFor="parking" className="text-sm">
                      Chỗ để xe
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="wc" />
                    <label htmlFor="wc" className="text-sm">
                      WC riêng
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="furniture" />
                    <label htmlFor="furniture" className="text-sm">
                      Nội thất
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="security" />
                    <label htmlFor="security" className="text-sm">
                      An ninh
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Hình ảnh</h3>

                <div className="grid gap-2">
                  <Label htmlFor="images">
                    Tải lên hình ảnh (tối đa 5 ảnh)
                  </Label>
                  <div className="border border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Kéo thả hình ảnh vào đây hoặc click để chọn file
                    </p>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      className="hidden"
                    />
                    <Button variant="outline" size="sm" className="mt-4">
                      Chọn hình ảnh
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Thông tin liên hệ</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contact-name">Tên liên hệ</Label>
                    <Input id="contact-name" placeholder="Họ và tên" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact-phone">Số điện thoại</Label>
                    <Input
                      id="contact-phone"
                      placeholder="Số điện thoại liên hệ"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Đăng tin
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
