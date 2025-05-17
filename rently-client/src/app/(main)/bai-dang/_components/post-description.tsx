interface PostDescriptionProps {
  description: string;
}

export function PostDescription({ description }: PostDescriptionProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">
        Mô tả chi tiết
      </h3>
      <div className="prose prose-sm max-w-none text-gray-700 text-xs sm:text-sm">
        <p className="whitespace-pre-line">
          {description || "Không có mô tả chi tiết"}
        </p>
      </div>
    </div>
  );
}
