"use client";

import { SmartHeroSection } from "@/components/smart-hero-section";
import { SearchResults } from "@/features/smart-search/components/SmartSearchBox";
import { MobileFilters } from "@/components/moblie-filters";
import { PageHeader } from "@/components/page-header";
import { NearbyPostsSection } from "@/components/nearby-posts-section";
import RentalListings from "@/components/rental-listings";
import SearchFilters, { FilterValues } from "@/components/search-filters";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const [activeFilters, setActiveFilters] = useState<FilterValues>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [smartSearchResults, setSmartSearchResults] = useState<any>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Scroll đến kết quả khi tìm kiếm
  useEffect(() => {
    if (hasSearched && resultsRef.current) {
      // Thời gian chờ ngắn để đảm bảo dữ liệu đã được render
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 300);
    }
  }, [hasSearched, searchQuery, activeFilters]);

  const handleFiltersChange = (newFilters: FilterValues) => {
    setActiveFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Đánh dấu đã tìm kiếm để trigger scroll
    setHasSearched(true);

    // Cập nhật filters với từ khóa tìm kiếm
    setActiveFilters((prev) => {
      const newFilters = {
        ...prev,
        title: query, // Thay đổi từ search thành title
      };
      return newFilters;
    });
  };

  const handleSmartSearchResults = (results: any) => {
    setSmartSearchResults(results);
    setHasSearched(true);
    // Scroll to results when we have smart search results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Thêm hiệu ứng hình học trang trí */}
      <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"></div>
      <div
        className="absolute top-[60%] left-[5%] w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl opacity-60 -z-10 animate-pulse"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <SmartHeroSection onSearchResults={handleSmartSearchResults} />
      <div className=" mx-auto px-4 md:px-8 py-16 relative">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />

        {/* Smart Search Results */}
        {smartSearchResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16"
            ref={resultsRef}
          >
            <SearchResults results={smartSearchResults} />
          </motion.div>
        )}

        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="relative mb-12">
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-40 h-1.5 bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 dark:from-blue-600 dark:via-purple-600 dark:to-pink-600 rounded-full opacity-70 blur-sm"></div>

            <PageHeader
              title="Khám phá phòng trọ phù hợp"
              description="Hàng ngàn phòng trọ chất lượng với đầy đủ tiện nghi tại các khu vực bạn mong muốn."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-10">
            <motion.div
              className="hidden md:block"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : -20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 transition-all duration-300 hover:shadow-md overflow-hidden relative group">
                {/* Hiệu ứng viền gradient */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-purple-300 dark:from-blue-600 dark:to-purple-600 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 blur-sm"></div>
                <div className="relative z-10">
                  <SearchFilters onFiltersChange={handleFiltersChange} />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="md:col-span-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: isLoaded ? 1 : 0, x: isLoaded ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="md:hidden mb-6">
                <MobileFilters onFiltersChange={handleFiltersChange} />
              </div>

              <div
                ref={resultsRef}
                className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden"
              >
                {/* Hiệu ứng trang trí góc */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-200/40 via-purple-200/30 to-pink-200/40 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-indigo-200/30 via-blue-200/20 to-cyan-200/30 dark:from-indigo-900/20 dark:via-blue-900/20 dark:to-cyan-900/20 rounded-full blur-2xl"></div>

                <div className="relative z-10">
                  <RentalListings
                    filters={activeFilters}
                    onFiltersChange={handleFiltersChange}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Section bài viết cho thuê gần bạn */}
          <motion.div
            className="mt-24"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isLoaded ? 1 : 0, y: isLoaded ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <div className="relative mb-12">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-40 h-1.5 bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 dark:from-cyan-600 dark:via-blue-600 dark:to-indigo-600 rounded-full opacity-70 blur-sm"></div>

              <PageHeader
                title="Bài viết cho thuê gần bạn"
                description="Khám phá các phòng trọ phù hợp gần vị trí hiện tại của bạn"
              />
            </div>

            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
              {/* Hiệu ứng trang trí góc */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-cyan-200/40 via-blue-200/30 to-indigo-200/40 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-gradient-to-tr from-blue-200/30 via-indigo-200/20 to-purple-200/30 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-full blur-2xl"></div>

              <div className="relative z-10">
                <NearbyPostsSection />
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
