import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface ImageGalleryProps {
  images: { url: string; source: string }[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <div className="relative mb-4 sm:mb-6 rounded-lg sm:rounded-xl overflow-hidden border bg-muted/20">
      <div className="relative aspect-[4/3] w-full">
        <Image
          src={images[activeImageIndex].url}
          alt={`Hình ảnh ${activeImageIndex + 1}`}
          fill
          priority
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
          className="object-cover"
        />

        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-7 h-7 sm:w-9 sm:h-9 shadow-sm"
              onClick={prevImage}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full w-7 h-7 sm:w-9 sm:h-9 shadow-sm"
              onClick={nextImage}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </>
        )}

        <div className="absolute bottom-2 right-2">
          <Badge
            variant="secondary"
            className="bg-black/50 text-white font-normal text-xs py-0.5"
          >
            {activeImageIndex + 1}/{images.length}
          </Badge>
        </div>
      </div>

      {/* Thanh thumbnail */}
      {images.length > 1 && (
        <ScrollArea className="w-full pb-1 pt-2">
          <div className="flex px-2 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setActiveImageIndex(index)}
                className={`relative h-12 sm:h-16 w-20 sm:w-24 flex-shrink-0 cursor-pointer rounded-md overflow-hidden transition ${
                  activeImageIndex === index
                    ? "ring-2 ring-primary ring-offset-1"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}
