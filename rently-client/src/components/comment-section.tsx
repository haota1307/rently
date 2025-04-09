"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Reply, Trash, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useComments } from "@/features/comment/useComment";
import { Comment } from "@/features/comment/comment.api";

import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { useConfirm } from "@/components/confirm-dialog";

interface CommentSectionProps {
  postId: number;
  hideCommentForm?: boolean;
}

export function CommentSection({
  postId,
  hideCommentForm = false,
}: CommentSectionProps) {
  const { showConfirm } = useConfirm();
  const {
    comments,
    loading,
    newComment,
    setNewComment,
    editingComment,
    editContent,
    setEditContent,
    replyingTo,
    replyContent,
    setReplyContent,
    hasMore,
    addComment,
    startReply,
    cancelReply,
    submitReply,
    startEdit,
    cancelEdit,
    submitEdit,
    deleteComment,
    loadMore,
    isAuth,
    page,
  } = useComments(postId);

  const { ref, inView } = useInView({
    threshold: 0.5,
    triggerOnce: false,
  });

  useEffect(() => {
    if (inView && hasMore && !loading) {
      loadMore();
    }
  }, [inView, hasMore, loading]);

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: vi,
      });
    } catch (e) {
      return "Không rõ thời gian";
    }
  };

  const handleDelete = (commentId: number) => {
    showConfirm({
      title: "Xác nhận xóa bình luận",
      description:
        "Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.",
      confirmText: "Xóa",
      cancelText: "Hủy",
      destructive: true,
      onConfirm: () => deleteComment(commentId),
    });
  };

  return (
    <div className="space-y-6">
      {!hideCommentForm && (
        <>
          <h3 className="text-xl font-semibold">Bình luận</h3>

          {/* Comment form */}
          <div className="space-y-4">
            <Textarea
              placeholder="Viết bình luận của bạn..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px]"
              disabled={!isAuth}
            />
            <div className="flex justify-end">
              <Button
                onClick={addComment}
                disabled={!isAuth || !newComment.trim()}
              >
                Gửi bình luận
              </Button>
            </div>
            {!isAuth && (
              <p className="text-sm text-muted-foreground text-center">
                Vui lòng đăng nhập để bình luận
              </p>
            )}
          </div>
        </>
      )}

      {/* Comments list */}
      <div className="space-y-4">
        {loading && page === 1 ? (
          <p className="text-center py-4">Đang tải bình luận...</p>
        ) : comments.length === 0 ? (
          <p className="text-center py-4 text-muted-foreground">
            Chưa có bình luận nào cho bài viết này
          </p>
        ) : (
          <>
            {comments.map((comment, commentIndex) => (
              <Card
                key={`comment-${comment.id}-${commentIndex}`}
                className="relative"
                ref={
                  commentIndex === comments.length - 1 && hasMore
                    ? ref
                    : undefined
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={comment.user.avatar || ""}
                        alt={comment.user.name}
                      />
                      <AvatarFallback>
                        {comment.user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold">
                            {comment.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        {isAuth && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => startEdit(comment)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(comment.id)}
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>

                      {editingComment === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={cancelEdit}
                            >
                              Hủy
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitEdit(comment.id)}
                            >
                              Lưu
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-700 whitespace-pre-line">
                          {comment.content}
                        </p>
                      )}

                      {!editingComment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-muted-foreground"
                          onClick={() => startReply(comment.id)}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Trả lời
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>

                {/* Replies section */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-12 pr-4 pb-2 space-y-3">
                    {comment.replies.map(
                      (reply: Comment, replyIndex: number) => (
                        <Card
                          key={`reply-${reply.id}-${comment.id}-${replyIndex}`}
                          className="relative"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={reply.user.avatar || ""}
                                  alt={reply.user.name}
                                />
                                <AvatarFallback>
                                  {reply.user.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-semibold">
                                      {reply.user.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-2">
                                      {formatDate(reply.createdAt)}
                                    </span>
                                  </div>
                                  {isAuth && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7"
                                        >
                                          <MoreVertical className="h-3 w-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => startEdit(reply)}
                                        >
                                          <Edit className="h-4 w-4 mr-2" />
                                          Chỉnh sửa
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(reply.id)}
                                        >
                                          <Trash className="h-4 w-4 mr-2" />
                                          Xóa
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>

                                {editingComment === reply.id ? (
                                  <div className="space-y-2">
                                    <Textarea
                                      value={editContent}
                                      onChange={(e) =>
                                        setEditContent(e.target.value)
                                      }
                                      className="min-h-[70px]"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={cancelEdit}
                                      >
                                        Hủy
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => submitEdit(reply.id)}
                                      >
                                        Lưu
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-gray-700 whitespace-pre-line">
                                    {reply.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}

                {/* Reply form */}
                {replyingTo === comment.id && (
                  <CardFooter className="px-4 py-3 border-t bg-muted/20">
                    <div className="w-full space-y-2">
                      <Textarea
                        placeholder="Viết trả lời của bạn..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelReply}
                        >
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => submitReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          Gửi trả lời
                        </Button>
                      </div>
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </>
        )}

        {loading && page > 1 && (
          <p className="text-center py-2">Đang tải thêm bình luận...</p>
        )}
      </div>
    </div>
  );
}
