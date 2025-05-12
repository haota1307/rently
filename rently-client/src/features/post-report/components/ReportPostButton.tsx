import { Button } from "@/components/ui/button";
import { ReportPostForm } from "./ReportPostForm";
import { Flag } from "lucide-react";

interface ReportPostButtonProps {
  postId: number;
  className?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

export function ReportPostButton({
  postId,
  className,
  variant = "outline",
}: ReportPostButtonProps) {
  return (
    <ReportPostForm
      postId={postId}
      trigger={
        <Button variant={variant} size="sm" className={className}>
          <Flag className="mr-2 h-4 w-4" /> Báo cáo bài đăng
        </Button>
      }
    />
  );
}
