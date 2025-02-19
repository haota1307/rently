import { ListingGallerySection } from "@/components/listings/listing-gallery-section";
import { ListingInfoSection } from "@/components/listings/listing-info-section";
import { ListingOwnerSection } from "@/components/listings/listing-owner-section";

const ListingIdPage = () => {
  // Mảng ảnh
  const images: string[] = [
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&auto=format&fit=crop&q=60",
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-y-8">
        {/* Cột bên trái: gallery */}
        <ListingGallerySection images={images} />

        {/* Cột bên phải: người cho thuê */}
        <ListingOwnerSection />
      </div>

      {/* Thông tin mô tả nhà trọ */}
      <ListingInfoSection />
    </div>
  );
};

export default ListingIdPage;
