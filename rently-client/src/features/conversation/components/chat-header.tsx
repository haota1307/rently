"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Conversation } from "@/features/conversation/message.types";
import { Loader2, UserCircle } from "lucide-react";

interface ChatHeaderProps {
  activeConversation: Conversation | null;
  socketConnected: boolean;
  userId?: number | null;
}

export function ChatHeader({
  activeConversation,
  socketConnected,
  userId,
}: ChatHeaderProps) {
  // Kiểm tra xem cần hiển thị thông tin của người dùng nào
  const getDisplayUser = (conversation: Conversation) => {
    return userId === conversation.userOneId
      ? conversation.userTwo
      : conversation.userOne;
  };

  if (!activeConversation) return null;

  const displayUser = getDisplayUser(activeConversation);

  return (
    <div className="border-b py-3 px-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Avatar>
          <AvatarImage src={displayUser.avatar || undefined} />
          <AvatarFallback>
            <UserCircle className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{displayUser.name}</div>
        </div>
      </div>

      {!socketConnected && (
        <div className="flex items-center text-xs text-muted-foreground">
          <Loader2 className="animate-spin h-3 w-3 mr-1" />
          Đang kết nối...
        </div>
      )}
    </div>
  );
}
