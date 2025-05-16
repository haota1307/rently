import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { useUiSettings } from "@/features/system-setting/hooks/useUiSettings";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { settings, isLoading, defaultSettings } = useUiSettings();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Sử dụng giá trị mặc định nếu đang loading
  const backgroundImage = isLoading
    ? defaultSettings.heroImage
    : settings.heroImage;

  return (
    <div className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10" />
      {isLoading ? (
        <Skeleton className="relative h-[600px] w-full" />
      ) : (
        <div
          className="relative h-[600px] bg-cover bg-center"
          style={{
            backgroundImage: `url('${backgroundImage}')`,
          }}
        >
          <div className="mx-auto px-8 h-full flex items-center relative z-20">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
                Tìm phòng trọ gần Đại học Nam Cần Thơ
              </h1>
              <p className="text-lg md:text-xl mb-8 text-gray-300 animate-fade-in delay-100">
                Khám phá không gian sống lý tưởng cho sinh viên, gần trường và
                tiện ích.
              </p>

              <div className="p-6 rounded-lg shadow-lg animate-slide-up">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Nhập tên bài đăng..."
                      className="h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Button size="lg" className="h-12" onClick={handleSearch}>
                    <Search className="mr-2 h-5 w-5" />
                    Tìm kiếm
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
