"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCircle, Plus } from "lucide-react";
import { Conversation } from "@/features/conversation/message.types";
import { Button } from "@/components/ui/button";

interface ConversationListProps {
  loading: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  userId?: number;
  onSelectConversation: (
    conversation: Conversation,
    e: React.MouseEvent
  ) => void;
  onNewConversation?: () => void;
}

export function ConversationList({
  loading,
  conversations,
  activeConversation,
  userId,
  onSelectConversation,
  onNewConversation,
}: ConversationListProps) {
  const getDisplayUser = (conversation: Conversation) => {
    return userId === conversation.userOneId
      ? conversation.userTwo
      : conversation.userOne;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-3 pb-0 flex-1 overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-medium">Cuộc trò chuyện</h2>
          {onNewConversation && (
            <Button
              onClick={onNewConversation}
              size="sm"
              variant="outline"
              className="h-8 px-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-xs">Tạo mới</span>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 flex-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground flex-1 flex flex-col items-center justify-center">
            <p className="mb-4">Bạn chưa có cuộc trò chuyện nào</p>
            {onNewConversation && (
              <Button onClick={onNewConversation} className="mt-2">
                <Plus className="h-4 w-4 mr-2" />
                Tạo cuộc trò chuyện mới
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="flex-1 h-0">
            <div className="space-y-2 pr-4">
              {conversations.map((conversation) => {
                const displayUser = getDisplayUser(conversation);
                const isUnread =
                  (conversation.unreadCount || 0) > 0 &&
                  userId !== conversation.latestMessage?.senderId;
                return (
                  <div
                    key={conversation.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                      activeConversation?.id === conversation.id
                        ? "bg-muted"
                        : ""
                    } ${isUnread ? "bg-primary/5" : ""}`}
                    onClick={(e) => onSelectConversation(conversation, e)}
                  >
                    <Avatar>
                      <AvatarImage src={displayUser.avatar || undefined} />
                      <AvatarFallback>
                        <UserCircle className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium truncate flex items-center gap-2">
                        {displayUser.name}
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
                        )}
                      </div>
                      <div
                        className={`text-xs truncate ${
                          isUnread
                            ? "text-foreground font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {conversation.latestMessage
                          ? conversation.latestMessage.content
                          : "Bắt đầu trò chuyện..."}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
