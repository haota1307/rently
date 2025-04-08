"use client";

import { useState } from "react";
import { useGetUserFavoritesQuery } from "@/features/favorite/useFavorite";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/hooks/use-auth";

import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Home, Loader2 } from "lucide-react";
import { RentalCard } from "@/components/rental-card";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { FavoriteWithRentalType } from "@/schemas/favorite.schema";
import { Container } from "@/components/container";

export default function SavedListingsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, isLoading, isError } = useGetUserFavoritesQuery({
    page,
    limit,
  });

  // Xử lý khi người dùng chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <Container>
        <EmptyState
          icon={Heart}
          title="Chưa đăng nhập"
          description="Vui lòng đăng nhập để xem danh sách tin đã lưu"
          action={
            <Button onClick={() => router.push("/dang-nhap")}>Đăng nhập</Button>
          }
        />
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center p-10">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Đang tải...</p>
        </div>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <EmptyState
          icon={Heart}
          title="Có lỗi xảy ra"
          description="Không thể tải danh sách tin đã lưu. Vui lòng thử lại sau."
          action={
            <Button onClick={() => window.location.reload()}>Thử lại</Button>
          }
        />
      </Container>
    );
  }

  const favorites = data?.data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <Container>
      <PageHeader
        title="Tin đã lưu"
        description="Danh sách các phòng trọ bạn đã lưu để xem lại sau"
      />

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Chưa có tin đã lưu"
          description="Bạn chưa lưu tin nào. Hãy khám phá các phòng trọ và lưu lại những tin bạn quan tâm."
          action={
            <Button onClick={() => router.push("/")}>
              <Home className="mr-2 h-4 w-4" />
              Khám phá phòng trọ
            </Button>
          }
        />
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {favorites.map((favorite: FavoriteWithRentalType) => {
              // Chuyển đổi dữ liệu để phù hợp với RentalCard
              const rental = {
                ...favorite.rental,
                createdAt:
                  favorite.rental.createdAt instanceof Date
                    ? favorite.rental.createdAt
                    : new Date(favorite.rental.createdAt),
                updatedAt:
                  favorite.rental.updatedAt instanceof Date
                    ? favorite.rental.updatedAt
                    : new Date(favorite.rental.updatedAt),
                distance: favorite.rental.distance || undefined,
                rooms: favorite.rental.rooms.map((room) => ({
                  ...room,
                  createdAt:
                    room.createdAt instanceof Date
                      ? room.createdAt
                      : new Date(room.createdAt),
                  updatedAt:
                    room.updatedAt instanceof Date
                      ? room.updatedAt
                      : new Date(room.updatedAt),
                })),
                rentalImages: favorite.rental.rentalImages.map((img) => ({
                  ...img,
                  createdAt:
                    img.createdAt instanceof Date
                      ? img.createdAt
                      : new Date(img.createdAt),
                })),
              };

              return (
                <RentalCard
                  key={favorite.id}
                  rental={rental}
                  showFavoriteButton
                />
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="my-8 flex justify-center">
              <CustomPagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
