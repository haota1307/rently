"use client";

import { useState } from "react";
import FiltersCombobox from "@/app/(public)/(main)/_components/filters-combobox";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";

const prices = [
  { label: "Dưới 1.5 triệu", value: "0-1500000" },
  { label: "1.5 triệu - 3 triệu", value: "1500000-3000000" },
  { label: "3 triệu - 5 triệu", value: "3000000-5000000" },
  { label: "Trên 5 triệu", value: "5000000+" },
];

const distances = [
  { label: "Dưới 1 Km", value: "0-1" },
  { label: "1 Km - 5 Km", value: "1-5" },
  { label: "5 Km - 10 Km", value: "5-10" },
  { label: "Trên 10 Km", value: "10+" },
];

const areas = [
  { label: "Dưới 10 m²", value: "0-10" },
  { label: "10 m² - 20 m²", value: "10-20" },
  { label: "20 m² - 30 m²", value: "20-30" },
  { label: "Trên 30 m²", value: "30+" },
];

const amenities = [
  { label: "Máy giặt", value: "washing_machine" },
  { label: "Máy lạnh", value: "air_conditioner" },
  { label: "Chỗ để xe", value: "parking" },
  { label: "WiFi miễn phí", value: "wifi" },
  { label: "Giờ giấc tự do", value: "24h_access" },
];

const Filters = () => {
  const [selectedPrice, setSelectedPrice] = useState("");
  const [selectedDistances, setSelectedDistance] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const toggleAmenity = (value: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(value)
        ? prev.filter((amenity) => amenity !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
      <FiltersCombobox
        options={prices}
        placeholder="Tìm theo giá"
        onSelect={(value) => setSelectedPrice(value)}
      />

      <FiltersCombobox
        options={distances}
        placeholder="Tìm theo khoảng cách"
        onSelect={(value) => setSelectedDistance(value)}
      />

      <FiltersCombobox
        options={areas}
        placeholder="Tìm theo diện tích"
        onSelect={(value) => setSelectedArea(value)}
      />

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            {selectedAmenities.length > 0
              ? `Đã chọn ${selectedAmenities.length} tiện ích`
              : "Tìm theo tiện ích"}
            <ChevronsUpDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <h3 className="font-semibold mb-2">Tiện ích</h3>
          <div className="flex flex-col justify-center gap-3">
            {amenities.map((amenity) => (
              <label
                key={amenity.value}
                className="flex items-center space-x-2"
              >
                <Checkbox
                  checked={selectedAmenities.includes(amenity.value)}
                  onCheckedChange={() => toggleAmenity(amenity.value)}
                />
                <span>{amenity.label}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default Filters;
