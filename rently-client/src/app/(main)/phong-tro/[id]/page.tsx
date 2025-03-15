import MapWithGeocoding from "@/features/map/map-with-geocoding";
import { RoomGallerySection } from "@/features/room/components/room-gallery-section";
import { RoomInfoSection } from "@/features/room/components/room-info-section";
import { RoomOwnerSection } from "@/features/room/components/room-owner-section";

const RoomIdPage = () => {
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
        <RoomGallerySection images={images} />

        <RoomOwnerSection />
      </div>

      <RoomInfoSection />
    </div>
  );
};

export default RoomIdPage;
