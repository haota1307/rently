import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAppStore } from "@/components/app-provider";
import commentApiRequest, { Comment } from "./comment.api";

export function useComments(postId: number) {
  const isAuth = useAppStore((state) => state.isAuth);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadedCommentIds, setLoadedCommentIds] = useState<Set<number>>(
    new Set()
  );

  // Fetch comments
  const fetchComments = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 1 : page;
      const response = await commentApiRequest.getComments({
        postId,
        page: currentPage,
        limit: 10,
      });

      const newComments = response.payload.data;

      // Lọc ra comments chưa được tải
      const uniqueNewComments = newComments.filter(
        (comment) => !loadedCommentIds.has(comment.id)
      );

      // Cập nhật danh sách ID đã tải
      const newLoadedIds = new Set(loadedCommentIds);
      uniqueNewComments.forEach((comment) => newLoadedIds.add(comment.id));
      setLoadedCommentIds(newLoadedIds);

      if (reset) {
        setComments(uniqueNewComments);
        setPage(1);
        setLoadedCommentIds(new Set(uniqueNewComments.map((c) => c.id)));
      } else {
        setComments((prev) => [...prev, ...uniqueNewComments]);
      }

      setHasMore(currentPage < response.payload.totalPages);
      setLoading(false);
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments(true);
    }
  }, [postId]);

  const addComment = async () => {
    if (!isAuth) {
      toast.error("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!newComment.trim()) return;

    try {
      const response = await commentApiRequest.createComment({
        content: newComment,
        postId,
      });

      const newCommentData = response.payload;

      // Kiểm tra nếu comment này chưa tồn tại trong danh sách
      if (!loadedCommentIds.has(newCommentData.id)) {
        // Thêm comment mới vào đầu danh sách
        setComments((prev) => [newCommentData, ...prev]);

        // Cập nhật danh sách ID đã tải
        setLoadedCommentIds((prev) => new Set([...prev, newCommentData.id]));
      }

      setNewComment("");
      toast.success("Đã thêm bình luận thành công");
    } catch (error) {
      console.error("Lỗi khi thêm bình luận:", error);
      toast.error("Không thể thêm bình luận");
    }
  };

  const startReply = (commentId: number) => {
    setReplyingTo(commentId);
    setReplyContent("");
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const submitReply = async (commentId: number) => {
    if (!isAuth) {
      toast.error("Vui lòng đăng nhập để trả lời bình luận");
      return;
    }

    if (!replyContent.trim()) return;

    try {
      const response = await commentApiRequest.createComment({
        content: replyContent,
        postId,
        parentId: commentId,
      });

      const newReply = response.payload;

      // Cập nhật replies của comment, đảm bảo không có trùng lặp
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            // Kiểm tra xem reply đã tồn tại chưa
            const replyExists = comment.replies?.some(
              (reply) => reply.id === newReply.id
            );

            if (replyExists) {
              return comment;
            }

            return {
              ...comment,
              replies: [...(comment.replies || []), newReply],
            };
          }
          return comment;
        })
      );

      setReplyingTo(null);
      setReplyContent("");
      toast.success("Đã trả lời bình luận thành công");
    } catch (error) {
      console.error("Lỗi khi trả lời bình luận:", error);
      toast.error("Không thể trả lời bình luận");
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent("");
  };

  const submitEdit = async (commentId: number) => {
    if (!isAuth) return;
    if (!editContent.trim()) return;

    try {
      const response = await commentApiRequest.updateComment(commentId, {
        content: editContent,
      });

      // Cập nhật comment đã chỉnh sửa
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === commentId) {
            return { ...comment, ...response.payload };
          }

          // Cập nhật cả trong replies
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map((reply: Comment) =>
                reply.id === commentId
                  ? { ...reply, ...response.payload }
                  : reply
              ),
            };
          }

          return comment;
        })
      );

      setEditingComment(null);
      setEditContent("");
      toast.success("Đã cập nhật bình luận thành công");
    } catch (error) {
      console.error("Lỗi khi cập nhật bình luận:", error);
      toast.error("Không thể cập nhật bình luận");
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!isAuth) return;

    try {
      await commentApiRequest.deleteComment(commentId);

      // Xóa comment khỏi danh sách
      setComments((prev) => {
        // Xóa comment cấp cao nhất
        const filtered = prev.filter((c) => c.id !== commentId);

        // Xóa replies của comment
        return filtered.map((comment) => {
          if (comment.replies) {
            return {
              ...comment,
              replies: comment.replies.filter(
                (reply: Comment) => reply.id !== commentId
              ),
            };
          }
          return comment;
        });
      });

      toast.success("Đã xóa bình luận thành công");
    } catch (error) {
      console.error("Lỗi khi xóa bình luận:", error);
      toast.error("Không thể xóa bình luận");
    }
  };

  const loadMore = () => {
    setPage((prev) => prev + 1);
    fetchComments();
  };

  return {
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
  };
}
