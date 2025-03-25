"use client";

import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface District {
  id: string;
  name: string;
  wards: Ward[];
  streets: string[];
}

interface Ward {
  id: string;
  name: string;
}

// Dữ liệu ví dụ
const districtsData: District[] = [
  {
    id: "1",
    name: "Quận Ninh Kiều",
    wards: [
      { id: "1", name: "Phường An Khánh" },
      { id: "2", name: "Phường An Cư" },
      { id: "3", name: "Phường Xuân Khánh" },
    ],
    streets: ["Đường 30 Tháng 4", "Đường 3/2", "Đường Lý Thường Kiệt"],
  },
  {
    id: "2",
    name: "Quận Bình Thủy",
    wards: [
      { id: "4", name: "Phường Long Hòa" },
      { id: "5", name: "Phường Xuân Khánh" },
    ],
    streets: ["Đường Lê Hồng Phong", "Đường Nguyễn Văn Cừ"],
  },
];

interface AddressSelectorProps {
  onAddressChange?: (address: string) => void;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  onAddressChange,
}) => {
  const province = "Cần Thơ"; // Cố định
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(
    null
  );
  const [selectedWard, setSelectedWard] = useState<string>("");
  const [selectedStreet, setSelectedStreet] = useState<string>("");
  const [detailedAddress, setDetailedAddress] = useState<string>("");

  useEffect(() => {
    let address = province;
    if (selectedDistrict) {
      address += ", " + selectedDistrict.name;
    }
    if (selectedWard) {
      address += ", " + selectedWard;
    }
    if (selectedStreet) {
      address += ", " + selectedStreet;
    }
    // Thêm "Việt Nam" để Mapbox nhận dạng tốt hơn
    address += ", Việt Nam";

    setDetailedAddress(address);

    if (onAddressChange) {
      onAddressChange(address);
    }
  }, [
    selectedDistrict,
    selectedWard,
    selectedStreet,
    province,
    onAddressChange,
  ]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Tỉnh/Thành phố</label>
        <Input value={province} readOnly />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Quận/Huyện</label>
        <Select
          onValueChange={(value: string) => {
            const district = districtsData.find((d) => d.id === value) || null;
            setSelectedDistrict(district);
            setSelectedWard("");
            setSelectedStreet("");
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn quận/huyện" />
          </SelectTrigger>
          <SelectContent>
            {districtsData.map((district) => (
              <SelectItem key={district.id} value={district.id}>
                {district.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phường/Xã</label>
        <Select
          onValueChange={(value: string) => setSelectedWard(value)}
          disabled={!selectedDistrict}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn phường/xã" />
          </SelectTrigger>
          <SelectContent>
            {selectedDistrict &&
              selectedDistrict.wards.map((ward) => (
                <SelectItem key={ward.id} value={ward.name}>
                  {ward.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Đường</label>
        <Select
          onValueChange={(value: string) => setSelectedStreet(value)}
          disabled={!selectedDistrict}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn đường" />
          </SelectTrigger>
          <SelectContent>
            {selectedDistrict &&
              selectedDistrict.streets.map((street, idx) => (
                <SelectItem key={idx} value={street}>
                  {street}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Địa chỉ chi tiết
        </label>
        <Input value={detailedAddress} readOnly />
      </div>
    </div>
  );
};

export default AddressSelector;
