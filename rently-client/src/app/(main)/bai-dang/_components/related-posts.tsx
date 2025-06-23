import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { RentalCard } from "@/components/rental-card";
import {
  useGetSimilarPostsByPrice,
  useGetSameRentalPosts,
} from "@/features/post/usePost";
import { RentalType } from "@/schemas/rental.schema";

interface RelatedPostsSectionProps {
  postId: number;
  rentalId: number;
}

export function RelatedPostsSection({
  postId,
  rentalId,
}: RelatedPostsSectionProps) {
  const { data: similarPosts, isLoading: loadingSimilar } =
    useGetSimilarPostsByPrice(postId);
  const { data: sameRentalPosts, isLoading: loadingSameRental } =
    useGetSameRentalPosts(rentalId, postId);

  const hasSimilarPosts = similarPosts?.data && similarPosts.data.length > 0;
  const hasSameRentalPosts =
    sameRentalPosts?.data && sameRentalPosts.data.length > 0;

  // Convert post data to rental format like RoomRecommendations does
  const convertPostToRental = (post: any): RentalType => {
    const room = post.room;
    const rental = post.rental;

    return {
      id: rental?.id || post.id,
      title: rental?.title || "Nhà trọ",
      address: rental?.address || "",
      description: post.title || "",
      lat: rental?.lat || 0,
      lng: rental?.lng || 0,
      distance: rental?.distance || 0,
      landlordId: rental?.landlordId || 0,
      createdAt: new Date(post.createdAt),
      updatedAt: new Date(post.updatedAt || post.createdAt),
      rentalImages:
        rental?.rentalImages?.map((img: any, index: number) => ({
          id: img.id || index,
          imageUrl: img.imageUrl,
          rentalId: rental.id,
          order: img.order || index,
        })) || [],
      rooms: [
        {
          id: room?.id || post.id,
          price: room?.price || 0,
          area: room?.area || 0,
          isAvailable: room?.isAvailable ?? true,
          rentalId: rental?.id || post.id,
          roomImages:
            room?.roomImages?.map((img: any, index: number) => ({
              id: img.id || index,
              imageUrl: img.imageUrl,
              roomId: room.id,
              order: img.order || index,
            })) || [],
          roomAmenities:
            room?.roomAmenities?.map((ra: any, index: number) => ({
              roomId: room.id,
              amenityId: ra.amenity?.id || index,
              amenity: {
                id: ra.amenity?.id || index,
                name: ra.amenity?.name || "",
              },
            })) || [],
        },
      ],
    } as RentalType;
  };

  return (
    <div className="mt-6 sm:mt-10">
      <Separator className="mb-4 sm:mb-6" />

      <Tabs defaultValue="similar">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
          <h3 className="text-lg sm:text-xl font-semibold">
            Phòng trọ liên quan
          </h3>
          <TabsList className="h-8 sm:h-9">
            <TabsTrigger
              value="similar"
              className="text-xs sm:text-sm h-7 sm:h-8"
            >
              Giá tương tự
            </TabsTrigger>
            <TabsTrigger
              value="sameRental"
              className="text-xs sm:text-sm h-7 sm:h-8"
            >
              Cùng nhà trọ
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="similar">
          {loadingSimilar ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-2 sm:p-3">
                    <Skeleton className="h-3 sm:h-4 w-3/4 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-2.5 sm:h-3 w-full mb-1.5 sm:mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-2.5 sm:h-3 w-1/3" />
                      <Skeleton className="h-2.5 sm:h-3 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !hasSimilarPosts ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              Không tìm thấy phòng trọ có giá tương tự
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {similarPosts.data.map((post) => (
                <RentalCard
                  key={post.id}
                  rental={convertPostToRental(post)}
                  viewMode="grid"
                  postId={post.id}
                  rentalId={post.rental?.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sameRental">
          {loadingSameRental ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-2 sm:p-3">
                    <Skeleton className="h-3 sm:h-4 w-3/4 mb-1.5 sm:mb-2" />
                    <Skeleton className="h-2.5 sm:h-3 w-full mb-1.5 sm:mb-2" />
                    <div className="flex justify-between">
                      <Skeleton className="h-2.5 sm:h-3 w-1/3" />
                      <Skeleton className="h-2.5 sm:h-3 w-1/4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !hasSameRentalPosts ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              Không tìm thấy phòng trọ khác trong cùng nhà trọ
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {sameRentalPosts.data.map((post) => (
                <RentalCard
                  key={post.id}
                  rental={convertPostToRental(post)}
                  viewMode="grid"
                  postId={post.id}
                  rentalId={post.rental?.id}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
