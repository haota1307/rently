import { Button } from "./button";
import { Heart } from "lucide-react";
import {
  useFavoritesMutation,
  useCheckFavoriteStatusQuery,
} from "../../features/favorite/useFavorite";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/use-auth";

interface FavoriteButtonProps {
  postId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FavoriteButton({
  postId,
  variant = "outline",
  size = "icon",
  className,
}: FavoriteButtonProps) {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useCheckFavoriteStatusQuery(postId);
  const favoritesMutation = useFavoritesMutation();

  const isFavorited = data?.isFavorited || false;

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      window.location.href = "/dang-nhap";
      return;
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
}
