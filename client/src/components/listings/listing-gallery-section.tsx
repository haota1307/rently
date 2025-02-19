import React from "react";
import GalleryLayout from "@/components/gallery-layout";

interface ListingGallerySectionProps {
  images: string[];
}

export function ListingGallerySection({ images }: ListingGallerySectionProps) {
  return (
    <div className="col-span-3 md:border-r border-gray-300 pr-4">
      <GalleryLayout images={images} />
    </div>
  );
}
