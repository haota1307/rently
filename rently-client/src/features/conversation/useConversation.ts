import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import conversationApiRequest from "./conversation.api";
import { useQuery, useMutation } from "@tanstack/react-query";

export const useConversation = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Mutation để tạo cuộc trò chuyện mới
  const createConversationMutation = useMutation({
    mutationFn: (data: { userTwoId: number; initialMessage?: string }) => {
      return conversationApiRequest.createConversation(data);
    },
    onSuccess: (response) => {
      const res = response.payload;
      toast.success(
        res.created
          ? "Đã tạo cuộc trò chuyện mới"
          : "Đã chuyển đến cuộc trò chuyện"
      );

      // Chuyển đến trang trò chuyện
      if (res.conversation) {
        router.push(`/tin-nhan?id=${res.conversation.id}`);
      }
    },
    onError: (error: any) => {
      toast.error(
        error?.payload?.message || "Không thể tạo cuộc trò chuyện lúc này"
      );
    },
  });

  // Hàm tạo cuộc trò chuyện và chuyển đến trang tin nhắn
  const startConversation = async (userId: number, initialMessage?: string) => {
    try {
      setLoading(true);
      await createConversationMutation.mutateAsync({
        userTwoId: userId,
        initialMessage,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return {
    startConversation,
    loading,
  };
};

// Hook cho danh sách cuộc trò chuyện
export const useGetConversations = (params?: {
  page?: number;
  limit?: number;
}) => {
  return useQuery({
    queryKey: ["conversations", params],
    queryFn: () => conversationApiRequest.getConversations(params),
    staleTime: 1000 * 60, // 1 phút
  });
};

// Hook cho danh sách tin nhắn trong cuộc trò chuyện
export const useGetMessages = (
  conversationId: number,
  params?: { page?: number; limit?: number }
) => {
  return useQuery({
    queryKey: ["messages", conversationId, params],
    queryFn: () => conversationApiRequest.getMessages(conversationId, params),
    staleTime: 1000 * 10, // 10 giây
    enabled: !!conversationId,
  });
};
