import { PageHeader } from "@/components/page-header";
import RentalListings from "@/components/rental-listings";
import { ListingSkeleton } from "@/components/skeletons";
import { Suspense } from "react";

const SavedArticlesPage = () => {
  return (
    <div className="w-full">
      <div className="container mx-auto px-8 py-12">
        <PageHeader
          title="Các bài viết đã lưu"
          description="Danh sách các bài viết cho thuê bạn đã lưu."
        />

        <div className="">
          <Suspense fallback={<ListingSkeleton count={6} />}>
            <RentalListings />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default SavedArticlesPage;
