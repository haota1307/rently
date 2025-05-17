import { Skeleton } from "@/components/ui/skeleton";

export function PostDetailSkeleton() {
  return (
    <div className="w-full mx-auto px-4 py-4 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div>
            <Skeleton className="h-6 sm:h-8 w-2/3" />
            <Skeleton className="h-3 sm:h-4 w-1/2 mt-1 sm:mt-2" />
          </div>

          <Skeleton className="aspect-video w-full rounded-lg" />

          <div className="flex justify-between items-center">
            <Skeleton className="h-6 sm:h-8 w-1/3" />
            <div className="flex space-x-2">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Skeleton className="h-5 sm:h-6 w-1/4" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Skeleton className="h-8 sm:h-10 w-full" />
              <Skeleton className="h-8 sm:h-10 w-full" />
              <Skeleton className="h-8 sm:h-10 w-full" />
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            <Skeleton className="h-5 sm:h-6 w-1/4" />
            <Skeleton className="h-16 sm:h-20 w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Skeleton className="h-[120px] sm:h-[150px] w-full rounded-xl" />
          </div>
          <div>
            <Skeleton className="h-[180px] sm:h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
