import { useComments } from "@/features/comment/useComment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Lock, Send, MessageSquare } from "lucide-react";
import Link from "next/link";

interface RealTimeCommentsProps {
  postId: number;
  commentInputRef: React.RefObject<HTMLTextAreaElement>;
}

export function RealTimeComments({
  postId,
  commentInputRef,
}: RealTimeCommentsProps) {
  const {
    comments,
    loading,
    isSubmitting,
    newComment,
    setNewComment,
    addComment,
    isAuth,
    totalComments,
  } = useComments(postId);

  const handleAddComment = async () => {
    if (!newComment.trim() || !isAuth) return;

    try {
      await addComment();
      if (commentInputRef.current) {
        commentInputRef.current.focus();
      }
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
    }
  };

  // Hiển thị bình luận theo thứ tự mới nhất đầu tiên
  const renderComments = () => {
    if (comments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="text-sm font-medium mb-1">Chưa có bình luận</h4>
          <p className="text-xs text-muted-foreground">
            Hãy là người đầu tiên bình luận về bài đăng này
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={`comment-${comment.id}`} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={comment.user?.avatar || ""}
                    alt={comment.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {comment.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">
                        {comment.user?.name}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(comment.createdAt).toLocaleString("vi-VN", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm whitespace-pre-line">
                    {comment.content}
                  </p>
                </div>
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-11 mt-3 space-y-3">
                  {comment.replies.map((reply: any) => (
                    <div key={`reply-${reply.id}`} className="border-l-2 pl-3">
                      <div className="flex items-start gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={reply.user?.avatar || ""}
                            alt={reply.user?.name || "User"}
                          />
                          <AvatarFallback>
                            {reply.user?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-xs">
                              {reply.user?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground ml-2">
                              {new Date(reply.createdAt).toLocaleString(
                                "vi-VN",
                                {
                                  year: "numeric",
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>

                          <p className="text-xs mt-0.5">{reply.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Phần hiển thị bình luận */}
      <div className="bg-muted/5 min-h-[250px] max-h-[450px] overflow-y-auto">
        {loading && comments.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              <p className="text-xs text-muted-foreground">
                Đang tải bình luận...
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 sm:p-5">{renderComments()}</div>
        )}
      </div>

      {/* Form nhập bình luận - Thiết kế mới */}
      <div className="border-t bg-card p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3">
          <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
            <AvatarImage
              src={isAuth ? "/placeholder.svg?height=40&width=40" : ""}
              alt="Avatar"
            />
            <AvatarFallback>{isAuth ? "U" : "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="relative">
              <Textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] sm:min-h-[100px] w-full resize-none"
                placeholder={
                  isAuth
                    ? "Chia sẻ ý kiến của bạn về bài đăng này..."
                    : "Vui lòng đăng nhập để bình luận"
                }
                disabled={!isAuth || isSubmitting}
              />

              {!isAuth && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-md">
                  <div className="text-center p-4">
                    <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-3">
                      Bạn cần đăng nhập để bình luận
                    </p>
                    <Button asChild size="sm">
                      <Link href="/dang-nhap">Đăng nhập</Link>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-foreground">
                Chia sẻ đánh giá chân thực để giúp người khác
              </p>
              <Button
                onClick={handleAddComment}
                disabled={!isAuth || !newComment.trim() || isSubmitting}
                size="sm"
                className="gap-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent"></div>
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Gửi bình luận</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
