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
    <div className="mt-2 grid grid-cols-5 gap-4">
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
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </span>
            </>
          ) : (
            <label
              htmlFor={`image-${index}`}
              className="flex flex-col items-center justify-center w-full h-full cursor-pointer"
            >
              <Upload className="h-6 w-6 text-gray-400" />
              <span className="mt-1 text-xs text-gray-500 text-center">
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
