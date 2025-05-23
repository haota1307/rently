import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useRouter } from "next/navigation";
import { createPostSlug } from "@/lib/utils";

interface RentalInfoProps {
  rental: {
    id: number;
    title: string;
    address: string;
    description?: string;
  };
}

export function RentalInfo({ rental }: RentalInfoProps) {
  const router = useRouter();

  const handleViewRental = () => {
    if (rental?.id) {
      router.push(`/nha-tro/${createPostSlug(rental.title, rental.id)}`);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <Home className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-sm sm:text-base">
              Thuộc nhà trọ: {rental?.title || "Không có thông tin"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {rental?.address}
            </p>
          </div>
        </div>
        {rental?.description && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-2 ml-5 sm:ml-7 line-clamp-2">
            {rental.description}
          </p>
        )}
        <div className="mt-2 sm:mt-3 ml-5 sm:ml-7">
          <Button
            variant="outline"
            size="sm"
            className="h-7 sm:h-9 text-xs sm:text-sm"
            onClick={handleViewRental}
          >
            Xem thông tin nhà trọ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
