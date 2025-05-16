import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { SimilarPostCard } from "@/components/similar-post-card";
import {
  useGetSimilarPostsByPrice,
  useGetSameRentalPosts,
} from "@/features/post/usePost";

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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {similarPosts.data.map((post) => (
                <SimilarPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sameRental">
          {loadingSameRental ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {sameRentalPosts.data.map((post) => (
                <SimilarPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
