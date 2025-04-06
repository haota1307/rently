import React from "react";
import { X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ImageUploadSlotsProps {
  imageSlots: Array<{ imageUrl: string; order: number } | null>;
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) => void;
  removeImage: (slotIndex: number) => void;
}

export function ImageUploadSlots({
  imageSlots,
  handleImageUpload,
  removeImage,
}: ImageUploadSlotsProps) {
  return (
    <div className="mt-1.5 grid grid-cols-5 gap-2 sm:gap-3">
      {imageSlots.map((image, index) => (
        <div
          key={index}
          className={`relative aspect-square border-2 ${
            image
              ? "border-solid border-primary"
              : "border-dashed border-gray-300"
          } rounded-lg flex items-center justify-center overflow-hidden`}
        >
          {image ? (
            <>
              <img
                src={image.imageUrl || "/placeholder.svg"}
                alt={`Hình ảnh ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-0.5 left-0.5 bg-black bg-opacity-50 text-white text-[10px] px-1.5 py-0.5 rounded">
                {index + 1}
              </span>
            </>
          ) : (
            <label
              htmlFor={`image-${index}`}
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
            >
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="mt-0.5 text-[10px] text-gray-500 text-center">
                Ảnh {index + 1}
              </span>
              <Input
                type="file"
                id={`image-${index}`}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, index)}
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
}
