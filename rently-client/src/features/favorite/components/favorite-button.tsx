"use client";

import { Heart } from "lucide-react";
import {
  useFavoritesMutation,
  useCheckFavoriteStatusQuery,
} from "../useFavorite";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface FavoriteButtonProps {
  postId?: number;
  rentalId?: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const FavoriteButton = ({
  postId,
  rentalId,
  variant = "outline",
  size = "icon",
  className,
}: FavoriteButtonProps) => {
  const { isAuthenticated } = useAuth();

  // Use postId with fallback to rentalId
  const finalPostId = postId || rentalId;

  if (!finalPostId) {
    console.warn("FavoriteButton: Both postId and rentalId are missing");
    return null;
  }

  const { data, isLoading } = useCheckFavoriteStatusQuery(finalPostId);
  const favoritesMutation = useFavoritesMutation();

  const isFavorited = data?.isFavorited || false;

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      return (window.location.href = "/dang-nhap");
    }

    // Send both postId and rentalId to API
    favoritesMutation.mutate({
      postId: finalPostId,
      ...(rentalId && { rentalId }),
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleToggleFavorite}
      disabled={favoritesMutation.isPending || isLoading}
    >
      <Heart
        className={cn(
          "h-4 w-4",
          isFavorited
            ? "fill-destructive text-destructive"
            : "text-muted-foreground"
        )}
      />
    </Button>
  );
};
