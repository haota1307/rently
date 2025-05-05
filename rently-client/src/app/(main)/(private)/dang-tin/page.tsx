"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useState } from "react";

// Component riêng cho số liệu dạng số
const NumberInput = ({
  id,
  placeholder,
  label,
  required = false,
  onChange,
}: {
  id: string;
  placeholder: string;
  label: string;
  required?: boolean;
  onChange?: (value: string) => void;
}) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="grid w-full items-center gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type="text"
        pattern="[0-9]*"
        id={id}
        placeholder={placeholder}
        onKeyPress={handleKeyPress}
        onChange={handleChange}
      />
    </div>
  );
};

const CreatePostPage = () => {
  const [price, setPrice] = useState("");
  const [area, setArea] = useState("");

  return (
    <div className="w-full">
      <div className="container mx-auto px-8 py-12">
        <PageHeader
          title="Các bài viết đã lưu"
          description="Danh sách các bài viết cho thuê bạn đã lưu."
        />

        <div className="mt-4">
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
                    <NumberInput
                      id="price"
                      label="Giá phòng (VNĐ)"
                      placeholder="Nhập giá phòng"
                      required
                      onChange={setPrice}
                    />

                    <NumberInput
                      id="area"
                      label="Diện tích (m²)"
                      placeholder="Ví dụ: 25"
                      required
                      onChange={setArea}
                    />

                    <div className="grid gap-2">
                      <Label htmlFor="deposit">Tiền đặt cọc</Label>
                      <Input id="deposit" placeholder="Ví dụ: 1 tháng" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="available-date">
                        Ngày có thể dọn vào
                      </Label>
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
    </div>
  );
};

export default CreatePostPage;
