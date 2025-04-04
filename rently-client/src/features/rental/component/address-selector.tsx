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
import {
  useDistricts,
  useStreets,
  useWards,
} from "@/features/address/useAddress";

interface AddressSelectorProps {
  onAddressChange?: (address: string) => void;
  defaultDistrict?: string;
  defaultWard?: string;
  defaultStreet?: string;
}

const AddressSelector: React.FC<AddressSelectorProps> = ({
  onAddressChange,
  defaultDistrict,
  defaultWard,
  defaultStreet,
}) => {
  const province = "Cần Thơ";
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<string>(defaultWard || "");
  const [selectedStreet, setSelectedStreet] = useState<string>(
    defaultStreet || ""
  );
  const [detailedAddress, setDetailedAddress] = useState<string>("");

  const { data: districts } = useDistricts();
  const { data: wards } = useWards();

  const districtsData = districts?.payload.districts || [];
  const wardsData = wards?.payload.wards || [];

  useEffect(() => {
    const addressParts = [
      "Việt Nam".trim(),
      province.trim(),
      selectedDistrict && selectedDistrict.name
        ? selectedDistrict.name.trim()
        : "",
      selectedWard ? selectedWard.trim() : "",
      selectedStreet ? selectedStreet.trim() : "",
    ].filter((part) => part !== "");

    const address = addressParts.join(", ");
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
            const district =
              districtsData.find((d) => d.id === Number(value)) || null;
            setSelectedDistrict(district);
            setSelectedWard("");
            setSelectedStreet("");
          }}
          defaultValue={defaultDistrict}
        >
          <SelectTrigger>
            <SelectValue placeholder="Chọn quận/huyện" />
          </SelectTrigger>
          <SelectContent>
            {districtsData.map((district) => (
              <SelectItem key={district.name} value={district.id.toString()}>
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
              wardsData
                .filter((ward) => ward.district_id === selectedDistrict.id)
                .map((ward) => (
                  <SelectItem key={ward.name} value={ward.name}>
                    {ward.name}
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
