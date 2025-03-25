"use client";

import React from "react";
import { House, MapPinned, Wallet } from "lucide-react";
import dynamic from "next/dynamic";

const MapWithDirections = dynamic(
  () => import("@/features/map/map-with-geocode"),
  { ssr: false }
);

export function RoomInfoSection() {
  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-medium uppercase">
        Nhà trọ ABC khu vực Trần Vĩnh Kiết gần đại học Nam Cần Thơ, đối diện
        công ty XYZ
      </h2>

      <div className="w-full flex items-center my-2 text-muted-foreground">
        <MapPinned className="size-4 mr-2" />
        <p>Trần Vĩnh Kiết, Quận Ninh Kiều, TP Cần Thơ</p>
      </div>

      <div className="w-full flex items-center gap-3 my-2">
        <span className="flex items-center justify-center text-rose-500">
          <Wallet className="size-4 mr-2" />
          <p>1.500.000 VND / Tháng</p>
        </span>
        <span>•</span>
        <span className="flex items-center justify-center">
          <House className="size-4 mr-2" />
          <p>32 m²</p>
        </span>
      </div>

      <div className="my-6">
        <p className="text-2xl font-medium">Thông tin mô tả</p>

        <div className="text-justify">
          <p className="mt-4">
            Nhà trọ ABC toạ lạc tại khu vực trung tâm, gần các trục đường lớn,
            thuận tiện cho việc di chuyển đến các trường đại học, chợ và khu mua
            sắm. Xung quanh khu trọ có nhiều quán ăn bình dân, quán cà phê và
            cửa hàng tiện lợi, giúp bạn dễ dàng mua sắm và giải trí. Không gian
            xung quanh khá yên tĩnh, an ninh đảm bảo nhờ hệ thống camera khu vực
            và đội ngũ bảo vệ tuần tra thường xuyên.
          </p>

          <p className="mt-4">
            Phòng tại Nhà trọ ABC được thiết kế thoáng mát, đón ánh sáng tự
            nhiên, đảm bảo không khí lưu thông tốt. Mỗi phòng đều được trang bị
            cơ bản với quạt trần hoặc điều hoà (tuỳ lựa chọn), giường, tủ quần
            áo, bàn học. Khu vực bếp và nhà vệ sinh sạch sẽ, được dọn dẹp định
            kỳ. Ngoài ra, nhà trọ còn cung cấp internet tốc độ cao, chỗ để xe
            rộng rãi và có bảo vệ trông coi xe 24/7.
          </p>

          <p className="mt-4">
            Nhà trọ ABC ưu tiên sinh viên và người đi làm, hỗ trợ giá thuê hợp
            lý cùng nhiều gói cọc linh hoạt. Chủ trọ thân thiện, sẵn sàng giải
            đáp và hỗ trợ khi có sự cố. Đặc biệt, khu vực sinh hoạt chung như
            sân phơi, khu tiếp khách và khu bếp được sắp xếp gọn gàng, tạo điều
            kiện cho việc giao lưu và gắn kết giữa các thành viên trong trọ. Với
            những ưu điểm nổi bật về vị trí, tiện nghi và chi phí, Nhà trọ ABC
            là lựa chọn đáng cân nhắc cho những ai đang tìm kiếm một không gian
            sống an toàn và thoải mái.
          </p>
        </div>
      </div>

      <div className="my-6">
        <p className="text-2xl font-medium mb-4">Vị trí & bản đồ</p>
        {/* <MapWithDirections
          rentalLocation={[105.72283696441788, 10.007994045116583]}
        /> */}
      </div>
    </div>
  );
}
