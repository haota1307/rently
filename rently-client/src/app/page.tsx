import { HeroSection } from "@/components/hero-section";
import { MobileFilters } from "@/components/moblie-filters";
import { PageHeader } from "@/components/page-header";
import RentalListings from "@/components/rental-listings";
import SearchFilters from "@/components/search-filters";
import { ListingSkeleton } from "@/components/skeletons";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Thuê Trọ - Tìm phòng trọ dễ dàng",
  description:
    "Nền tảng kết nối người thuê và chủ trọ, giúp bạn tìm phòng trọ phù hợp nhanh chóng và tiện lợi.",
};

export default function Home() {
  return (
    <div className="">
      <HeroSection />
      <div className="container mx-auto px-8 py-12">
        <PageHeader
          title="Khám phá phòng trọ phù hợp"
          description="Hàng ngàn phòng trọ chất lượng với đầy đủ tiện nghi tại các khu vực bạn mong muốn."
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="hidden md:block">
            <SearchFilters />
          </div>

          <div className="md:col-span-3">
            <div className="md:hidden mb-4">
              <MobileFilters />
            </div>

            <Suspense fallback={<ListingSkeleton count={6} />}>
              <RentalListings />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
