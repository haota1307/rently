import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PostType, RentalPostStatus } from "@/schemas/post.schema";
import { RentalType } from "@/schemas/rental.schema";
import {
  useComparisonStore,
  MAX_COMPARISON_ITEMS,
} from "@/features/comparison/comparison.store";
import { BarChart2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface ComparisonButtonProps {
  post?: PostType;
  rental?: RentalType;
  className?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showTooltip?: boolean;
  showText?: boolean;
}

export function ComparisonButton({
  post,
  rental,
  className,
  variant = "secondary",
  size = "icon",
  showTooltip = true,
  showText = false,
}: ComparisonButtonProps) {
  const { addItem, addRental, removeItem, isAdded } = useComparisonStore();

  // Kiểm tra xem item có trong danh sách so sánh không
  let itemId: number | undefined;
  if (post) {
    itemId = post.room?.id ?? post.id;
  } else if (rental) {
    itemId = rental.rooms?.[0]?.id ?? rental.id;
  }

  const isInComparison = itemId ? isAdded(itemId) : false;

  const handleToggleComparison = () => {
    if (!itemId) return;

    if (isInComparison) {
      removeItem(itemId);
      toast.success("Đã xóa khỏi danh sách so sánh");
    } else {
      let added = false;

      if (post) {
        added = addItem(post);
      } else if (rental) {
        added = addRental(rental);
      }

      if (added) {
        toast.success("Đã thêm vào danh sách so sánh");
      } else {
        toast.error(
          `Chỉ có thể so sánh tối đa ${MAX_COMPARISON_ITEMS} phòng trọ`
        );
      }
    }
  };

  const button = (
    <Button
      variant={isInComparison ? "default" : variant}
      size={size}
      onClick={handleToggleComparison}
      className={cn(
        isInComparison ? "bg-primary text-primary-foreground" : "",
        className
      )}
      aria-label={isInComparison ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
    >
      {isInComparison ? (
        <Check className="h-4 w-4" />
      ) : (
        <BarChart2 className="h-4 w-4" />
      )}
      {(size !== "icon" || showText) && (
        <span>{isInComparison ? "Đã thêm" : "So sánh"}</span>
      )}
    </Button>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="bottom">
            {isInComparison ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}

export function ComparisonFloatingButton() {
  const { items } = useComparisonStore();
  const count = items.length;

  if (count === 0) return null;

  return (
    <Link href="/so-sanh">
      <Button
        className="fixed bottom-8 right-8 z-50 rounded-full shadow-lg px-4 py-6"
        size="lg"
      >
        <BarChart2 className="h-5 w-5 mr-2" />
        So sánh ({count})
      </Button>
    </Link>
  );
}
