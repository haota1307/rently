"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SmartSearchBox } from "@/features/smart-search/components/SmartSearchBox";
import { useUiSettings } from "@/features/system-setting/hooks/useUiSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

interface SmartHeroSectionProps {
  onSearchResults?: (results: any) => void;
}

export function SmartHeroSection({ onSearchResults }: SmartHeroSectionProps) {
  const { settings, isLoading, defaultSettings } = useUiSettings();

  // Sử dụng giá trị mặc định nếu đang loading
  const backgroundImage = isLoading
    ? defaultSettings.heroImage
    : settings.heroImage;

  return (
    <div className="relative overflow-hidden">
      {/* Background với overlay gradient */}
      <div className="absolute inset-0">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url('${backgroundImage}')`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
      </div>

      {/* Hiệu ứng trang trí */}
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse opacity-60" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse opacity-40" />

      {/* Content */}
      <div className="relative z-20 min-h-[450px] md:min-h-[500px] flex items-center">
        <div className="container mx-auto px-4 md:px-8 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            {/* Heading với animation */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6 md:mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-yellow-400 animate-pulse" />
                <span className="text-yellow-400 font-semibold text-base md:text-lg">
                  Tìm kiếm thông minh với AI
                </span>
                <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-yellow-400 animate-pulse" />
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6 leading-tight">
                Tìm phòng trọ gần
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent block mt-1 md:mt-2">
                  Đại học Nam Cần Thơ
                </span>
              </h1>

              <p className="text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed max-w-lg md:max-w-2xl mx-auto">
                Khám phá không gian sống lý tưởng cho sinh viên với AI thông
                minh. Tìm phòng trọ chất lượng, giá tốt gần trường!
              </p>
            </motion.div>

            {/* Smart Search Box */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8 md:mb-12"
            >
              <SmartSearchBox
                onSearchResults={onSearchResults}
                variant="hero"
                placeholder="Tìm phòng gần trường, có wifi, máy lạnh, cho nuôi thú cưng..."
                className="max-w-sm md:max-w-3xl mx-auto"
              />
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="absolute bottom-4 md:bottom-6 left-1/2 transform -translate-x-1/2"
            >
              <div className="w-5 h-8 border-2 border-white/30 rounded-full flex justify-center">
                <div className="w-0.5 h-2 bg-white/60 rounded-full mt-1.5 animate-bounce" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
