import { MapPin } from "lucide-react";

interface PostHeaderProps {
  title: string;
  address: string;
}

export function PostHeader({ title, address }: PostHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">
        {title}
      </h1>
      <div className="flex items-center text-muted-foreground text-xs sm:text-sm space-x-1">
        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
        <span className="line-clamp-1">{address || "Không có địa chỉ"}</span>
      </div>
    </div>
  );
}
