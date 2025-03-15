import GalleryLayout from "@/components/gallery-layout";

interface RoomGallerySectionProps {
  images: string[];
}

export function RoomGallerySection({ images }: RoomGallerySectionProps) {
  return (
    <div className="col-span-3 md:border-r border-gray-300 pr-4">
      <GalleryLayout images={images} />
    </div>
  );
}
