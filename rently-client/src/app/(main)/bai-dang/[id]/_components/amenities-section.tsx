interface AmenitiesSectionProps {
  amenities: string[];
}

export function AmenitiesSection({ amenities }: AmenitiesSectionProps) {
  if (amenities.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">
        Tiện ích
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
        {amenities.map((amenity, index) => (
          <div
            key={index}
            className="flex items-center p-1.5 sm:p-2 border rounded-md bg-background"
          >
            <span className="text-xs sm:text-sm">{amenity}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
