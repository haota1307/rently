"use client";

import { Button } from "../../../components/ui/button";
import { Heart } from "lucide-react";
import {
  useFavoritesMutation,
  useCheckFavoriteStatusQuery,
} from "../useFavorite";
import { cn } from "../../../lib/utils";
import { useAuth } from "../../../hooks/use-auth";

interface FavoriteButtonProps {
  postId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export const FavoriteButton = ({
  postId,
  variant = "outline",
  size = "icon",
  className,
}: FavoriteButtonProps) => {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useCheckFavoriteStatusQuery(postId);
  const favoritesMutation = useFavoritesMutation();

  const isFavorited = data?.isFavorited || false;

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      return (window.location.href = "/dang-nhap");
    }

    favoritesMutation.mutate({ postId });
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
