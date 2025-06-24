import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RefreshCcw } from "lucide-react";
import { RealTimeComments } from "./real-time-comments";
import { useComments } from "@/features/comment/useComment";
import { useRef } from "react";

interface CommentSectionProps {
  postId: number;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const {
    comments,
    loading,
    isSubmitting,
    newComment,
    setNewComment,
    addComment,
    isAuth,
    totalComments,
    editingComment,
    editContent,
    setEditContent,
    startEdit,
    cancelEdit,
    submitEdit,
    deleteComment,
  } = useComments(postId);

  return (
    <div className="mt-6 sm:mt-8">
      <Separator className="mb-4 sm:mb-6" />
      <div className="flex justify-between items-center mb-3 sm:mb-4">
        <h3 className="text-lg sm:text-xl font-semibold">
          Đánh giá & Bình luận
        </h3>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {/* Header phần bình luận */}
          <div className="p-3 sm:p-4 border-b bg-card flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary hover:bg-primary/10 py-1 sm:py-1.5 h-auto text-xs"
              >
                <span className="font-semibold">{totalComments || 0}</span>
                <span className="ml-1">bình luận</span>
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3 border-dashed"
              onClick={() => {
                window.location.reload();
              }}
            >
              <RefreshCcw className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-2" />
              Làm mới
            </Button>
          </div>

          {/* Phần hiển thị bình luận */}
          <div className="flex flex-col bg-background">
            <RealTimeComments
              postId={postId}
              commentInputRef={commentInputRef}
              comments={comments}
              loading={loading}
              isSubmitting={isSubmitting}
              newComment={newComment}
              setNewComment={setNewComment}
              addComment={addComment}
              isAuth={isAuth}
              totalComments={totalComments}
              editingComment={editingComment}
              editContent={editContent}
              setEditContent={setEditContent}
              startEdit={startEdit}
              cancelEdit={cancelEdit}
              submitEdit={submitEdit}
              deleteComment={deleteComment}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
