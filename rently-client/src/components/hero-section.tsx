import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent z-10" />
      <div
        className="relative h-[600px] bg-cover bg-center"
        style={{
          backgroundImage: "url('/hero_img.jpg?height=600&width=1200')",
        }}
      >
        <div className="container mx-auto px-8 h-full flex items-center relative z-20">
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
                    placeholder="Nhập khu vực cụ thể..."
                    className="h-12"
                  />
                </div>
                <Button size="lg" className="h-12">
                  <Search className="mr-2 h-5 w-5" />
                  Tìm kiếm
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
