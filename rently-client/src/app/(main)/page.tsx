"use client";

import { HeroSection } from "@/components/hero-section";
import { MobileFilters } from "@/components/moblie-filters";
import { PageHeader } from "@/components/page-header";
import RentalListings from "@/components/rental-listings";
import SearchFilters, { FilterValues } from "@/components/search-filters";
import { useState } from "react";

export default function Home() {
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});
  const [searchQuery, setSearchQuery] = useState("");

  const handleFiltersChange = (newFilters: FilterValues) => {
    console.log("Filters changed:", newFilters);
    setActiveFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    console.log("Search query:", query);
    setSearchQuery(query);
    // Cập nhật filters với từ khóa tìm kiếm
    setActiveFilters((prev) => {
      const newFilters = {
        ...prev,
        title: query, // Thay đổi từ search thành title
      };
      console.log("New filters:", newFilters);
      return newFilters;
    });
  };

  return (
    <div className="w-full">
      <HeroSection onSearch={handleSearch} />
      <div className="container mx-auto px-8 py-12">
        <PageHeader
          title="Khám phá phòng trọ phù hợp"
          description="Hàng ngàn phòng trọ chất lượng với đầy đủ tiện nghi tại các khu vực bạn mong muốn."
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="hidden md:block">
            <SearchFilters onFiltersChange={handleFiltersChange} />
          </div>

          <div className="md:col-span-3">
            <div className="md:hidden mb-4">
              <MobileFilters onFiltersChange={handleFiltersChange} />
            </div>

            <RentalListings
              filters={activeFilters}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
