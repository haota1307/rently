import { Card, CardContent } from "@/components/ui/card";

interface LocationMapProps {
  lat?: number;
  lng?: number;
}

export function LocationMap({ lat, lng }: LocationMapProps) {
  // Tạo URL Google Maps embed từ lat, lng
  const googleMapsUrl =
    lat && lng
      ? `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${lat},${lng}&zoom=17`
      : null;

  if (!googleMapsUrl) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-5">
        <h3 className="font-medium text-sm sm:text-base mb-3">
          Vị trí trên bản đồ
        </h3>
        <div className="aspect-video w-full rounded-md overflow-hidden border">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={googleMapsUrl}
          ></iframe>
        </div>
      </CardContent>
    </Card>
  );
}
