import React from "react";

interface GalleryLayoutProps {
  images: string[];
}

/**
 * Component hiển thị:
 * - Ảnh đầu tiên (mainImage) ở bên trái, tỷ lệ 16:9
 * - Tối đa 3 ảnh nhỏ ở cột bên phải, cũng giữ tỷ lệ 16:9
 * - Nếu có hơn 4 ảnh, ảnh thứ tư sẽ có overlay hiển thị số ảnh còn lại (VD: +2)
 */
export default function GalleryLayout({ images }: GalleryLayoutProps) {
  // Nếu không có ảnh, không render gì
  if (!images || images.length === 0) return null;

  // Ảnh chính (lớn) là phần tử đầu tiên
  const mainImage = images[0];

  // Các ảnh còn lại (bên phải)
  const otherImages = images.slice(1);

  // Nếu có > 4 ảnh => hiển thị overlay ở ảnh cuối cột bên phải
  const showOverlay = images.length > 4;
  // Tối đa hiển thị 3 ảnh (trong cột bên phải)
  const displayRightImages = showOverlay
    ? otherImages.slice(0, 3)
    : otherImages;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Flex: cột dọc trên mobile, hàng ngang trên md */}
      <div className="flex flex-row gap-4">
        {/* Ảnh lớn bên trái (16:9) */}
        <div className="relative w-full md:w-3/4 aspect-video">
          <img
            src={mainImage}
            alt="Main"
            className="absolute inset-0 w-full h-full object-cover rounded shadow"
          />
        </div>

        {/* Cột ảnh nhỏ bên phải (tối đa 3 ảnh, 16:9) */}
        <div className="w-full md:w-1/4 flex flex-col gap-4">
          {displayRightImages.map((url, index) => {
            // Nếu đây là ảnh cuối cùng trong cột bên phải và có overlay
            const isLastDisplayed = index === displayRightImages.length - 1;

            if (showOverlay && isLastDisplayed) {
              return (
                <div key={index} className="relative aspect-video">
                  <img
                    src={url}
                    alt={`Image ${index + 2}`}
                    className="absolute inset-0 w-full h-full object-cover rounded shadow"
                  />
                  {/* Overlay hiển thị số ảnh còn lại */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded">
                    <span className="text-white text-xl">
                      +{images.length - 4}
                    </span>
                  </div>
                </div>
              );
            }

            // Nếu không phải ảnh overlay, hiển thị bình thường
            return (
              <div key={index} className="relative aspect-video">
                <img
                  src={url}
                  alt={`Image ${index + 2}`}
                  className="absolute inset-0 w-full h-full object-cover rounded shadow"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
