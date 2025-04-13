"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Send, UserCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import conversationApiRequest from "@/features/conversation/conversation.api";
import { Conversation } from "@/features/conversation/conversation.api";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";

// Định nghĩa kiểu dữ liệu cho tin nhắn
interface Message {
  id: number | string; // Cho phép id có thể là string (cho tin nhắn tạm thời) hoặc number (từ server)
  content: string;
  createdAt: string;
  senderId: number;
  isRead: boolean;
  conversationId: number;
  sender: {
    id: number;
    name: string;
    avatar: string | null;
  };
}

export default function MessagesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const conversationId = searchParams.get("id");
  const { isAuthenticated, userId } = useAuth();
  const socket = useAppStore((state) => state.socket);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketEvents, setSocketEvents] = useState<string[]>([]);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Thiết lập một tham chiếu để lưu tin nhắn đang xử lý
  const sentMessages = useRef(new Set<string>());

  // Kiểm tra kết nối socket
  useEffect(() => {
    if (!socket) {
      return;
    }

    // Kiểm tra socket đã kết nối chưa
    if (socket.connected) {
      setSocketConnected(true);
    } else {
      socket.connect();
    }

    // Lắng nghe sự kiện kết nối
    const onConnect = () => {
      setSocketConnected(true);
      toast.success("Đã kết nối realtime");
      // Đăng ký lại người dùng sau khi kết nối
      if (userId) {
        socket.emit("registerUser", userId);
      }
    };

    // Lắng nghe sự kiện ngắt kết nối
    const onDisconnect = (reason: string) => {
      setSocketConnected(false);
      toast.error("Mất kết nối realtime");
    };

    // Lắng nghe lỗi
    const onError = (error: Error) => {
      toast.error("Lỗi kết nối: " + error.message);
    };

    // Lắng nghe sự kiện reconnect
    const onReconnect = (attempt: number) => {
      // Xử lý khi kết nối lại
    };

    // Lắng nghe sự kiện reconnect_attempt
    const onReconnectAttempt = (attempt: number) => {
      // Xử lý khi đang thử kết nối lại
    };

    // Đăng ký các sự kiện
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("error", onError);
    socket.on("reconnect", onReconnect);
    socket.on("reconnect_attempt", onReconnectAttempt);

    // Cleanup
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("error", onError);
      socket.off("reconnect", onReconnect);
      socket.off("reconnect_attempt", onReconnectAttempt);
    };
  }, [socket, userId]);

  // Tải danh sách cuộc trò chuyện
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await conversationApiRequest.getConversations();
        setConversations(response.payload.data);

        // Nếu có id trong URL thì chọn cuộc trò chuyện đó
        if (conversationId) {
          const selectedConversation = response.payload.data.find(
            (conv) => conv.id === Number(conversationId)
          );
          if (selectedConversation) {
            setActiveConversation(selectedConversation);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải danh sách trò chuyện");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchConversations();
    }
  }, [isAuthenticated, conversationId]);

  // Tải tin nhắn khi chọn cuộc trò chuyện
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation) return;

      try {
        setLoadingMessages(true);

        // Tham gia vào phòng chat qua socket
        if (socket && socket.connected && activeConversation.id) {
          socket.emit("joinChat", activeConversation.id);
          setSocketEvents((prev) => [
            ...prev,
            `Tham gia phòng: chat:${activeConversation.id}`,
          ]);
        }

        const response = await conversationApiRequest.getMessages(
          activeConversation.id
        );
        setMessages(response.payload.data.reverse()); // Đảo ngược để hiển thị tin nhắn cũ nhất trước
      } catch (error) {
        toast.error("Không thể tải tin nhắn");
      } finally {
        setLoadingMessages(false);
      }
    };

    if (activeConversation) {
      fetchMessages();
    }

    // Cleanup: Rời phòng chat khi thay đổi cuộc trò chuyện
    return () => {
      if (socket && socket.connected && activeConversation?.id) {
        socket.emit("leaveChat", activeConversation.id);
        setSocketEvents((prev) => [
          ...prev,
          `Rời phòng: chat:${activeConversation.id}`,
        ]);
      }
    };
  }, [activeConversation, socket]);

  // Thiết lập lắng nghe sự kiện socket
  useEffect(() => {
    if (!socket || !userId) return;

    // Lắng nghe sự kiện nhận tin nhắn mới
    const onNewMessage = (newMessage: Message) => {
      // Nếu là tin nhắn của chính người dùng gửi đi, bỏ qua
      // (vì chúng ta đã thêm vào UI khi gửi đi rồi)
      if (newMessage.senderId === userId) {
        // Cập nhật ID thực nếu cần
        setMessages((prev) => {
          // Tìm xem có tin nhắn tạm thời tương ứng không
          const hasTempMessage = prev.some(
            (msg) =>
              typeof msg.id === "string" &&
              msg.id.startsWith("temp-") &&
              msg.content === newMessage.content
          );

          if (hasTempMessage) {
            return prev.map((msg) =>
              typeof msg.id === "string" &&
              msg.id.startsWith("temp-") &&
              msg.content === newMessage.content
                ? { ...msg, id: newMessage.id }
                : msg
            );
          }

          // Kiểm tra xem tin nhắn đã tồn tại (có thể đã được cập nhật ID) chưa
          const exists = prev.some(
            (msg) =>
              msg.content === newMessage.content &&
              msg.senderId === newMessage.senderId &&
              Math.abs(
                new Date(msg.createdAt).getTime() -
                  new Date(newMessage.createdAt).getTime()
              ) < 10000
          );

          if (exists) {
            return prev;
          }

          return [...prev, newMessage];
        });
      }
      // Nếu là tin nhắn từ người khác gửi đến
      else {
        // Kiểm tra cuộc trò chuyện hiện tại
        if (
          activeConversation &&
          newMessage.conversationId === activeConversation.id
        ) {
          setMessages((prev) => {
            // Kiểm tra xem tin nhắn đã tồn tại chưa
            const exists = prev.some(
              (msg) =>
                String(msg.id) === String(newMessage.id) ||
                (msg.content === newMessage.content &&
                  msg.senderId === newMessage.senderId &&
                  Math.abs(
                    new Date(msg.createdAt).getTime() -
                      new Date(newMessage.createdAt).getTime()
                  ) < 10000)
            );

            if (exists) {
              return prev;
            }

            return [...prev, newMessage];
          });

          // Cuộn xuống cuối cùng khi nhận tin nhắn mới
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        }
      }

      // Cập nhật danh sách cuộc trò chuyện với tin nhắn mới nhất
      setConversations((prevConversations) => {
        const typedConversations: Conversation[] = prevConversations;

        return typedConversations.map((conv) => {
          if (conv.id === newMessage.conversationId) {
            // Đảm bảo id luôn là số
            const messageId =
              typeof newMessage.id === "string"
                ? parseInt(newMessage.id.replace(/\D/g, "")) || Date.now()
                : newMessage.id;

            return {
              ...conv,
              latestMessage: {
                id: messageId,
                content: newMessage.content,
                createdAt: newMessage.createdAt,
                senderId: newMessage.senderId,
              },
              unreadCount:
                userId !== newMessage.senderId
                  ? (conv.unreadCount || 0) + 1
                  : conv.unreadCount,
            };
          }
          return conv;
        }) as Conversation[];
      });

      // Cập nhật danh sách sự kiện socket (chỉ dùng cho debug, không hiển thị cho người dùng)
      setSocketEvents((prev) => [
        ...prev,
        `Tin nhắn mới: ${newMessage.content} (ID: ${newMessage.id})`,
      ]);
    };

    // Lắng nghe sự kiện cuộc trò chuyện mới
    const onNewConversation = (conversation: Conversation) => {
      setSocketEvents((prev) => [
        ...prev,
        `Cuộc trò chuyện mới: ${conversation.id}`,
      ]);
      setConversations((prev) => [conversation, ...prev]);
    };

    socket.on("newMessage", onNewMessage);
    socket.on("newConversation", onNewConversation);

    // Debugging: Thử đăng ký một sự kiện test để xem socket có hoạt động không
    socket.on("test", (data: any) => {
      setSocketEvents((prev) => [
        ...prev,
        `Sự kiện test: ${JSON.stringify(data)}`,
      ]);
    });

    // Ngay sau khi thiết lập sự kiện, gửi một sự kiện echo
    socket.emit("echo", { message: "Kiểm tra socket echo", userId });

    // Lắng nghe sự kiện echo phản hồi
    socket.on("echoResponse", (data: any) => {
      setSocketEvents((prev) => [...prev, `Echo: ${JSON.stringify(data)}`]);
    });

    // Cleanup khi component unmount
    return () => {
      socket.off("newMessage", onNewMessage);
      socket.off("newConversation", onNewConversation);
      socket.off("test");
      socket.off("echoResponse");
    };
  }, [socket, activeConversation, userId]);

  // Cuộn xuống cuối cùng của tin nhắn khi tin nhắn thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return;

    try {
      // Lưu lại nội dung tin nhắn trước khi xóa khỏi input
      const messageContent = message.trim();

      // Tạo khóa duy nhất cho tin nhắn này
      const messageKey = `${userId}-${messageContent}-${Date.now()}`;

      // Đánh dấu tin nhắn này đang được xử lý
      sentMessages.current.add(messageKey);

      // Xóa tin nhắn khỏi input trước
      setMessage("");

      // Tạo một ID tạm thời cho tin nhắn
      const tempId = `temp-${Date.now()}`;

      const newMessage: Message = {
        id: tempId,
        content: messageContent,
        createdAt: new Date().toISOString(),
        senderId: userId || 0,
        isRead: false,
        conversationId: activeConversation.id,
        sender: {
          id: userId || 0,
          name: "Bạn",
          avatar: null,
        },
      };

      // Thêm tin nhắn vào UI trước
      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();

      // Gửi tin nhắn lên server
      const response = await conversationApiRequest.sendMessage({
        conversationId: activeConversation.id,
        content: messageContent,
      });

      // Cập nhật tin nhắn với ID thực từ server (nếu có)
      if (response.payload && response.payload.id) {
        const serverId = response.payload.id;

        // Cập nhật trong messages
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempId ? { ...msg, id: serverId } : msg
          )
        );

        // Cập nhật trong conversations nếu đây là tin nhắn mới nhất
        setConversations((prevConversations) => {
          const typedConversations: Conversation[] = prevConversations;

          return typedConversations.map((conv) => {
            if (conv.id === activeConversation.id) {
              return {
                ...conv,
                latestMessage: {
                  id: serverId,
                  content: messageContent,
                  createdAt: newMessage.createdAt,
                  senderId: userId || 0,
                },
              };
            }
            return conv;
          }) as Conversation[];
        });
      }

      // Xóa khỏi danh sách đang xử lý sau 30 giây
      setTimeout(() => {
        sentMessages.current.delete(messageKey);
      }, 30000);
    } catch (error) {
      toast.error("Không thể gửi tin nhắn");
    }
  };

  // Chọn cuộc trò chuyện
  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    router.push(`/tin-nhan?id=${conversation.id}`, { scroll: false });
  };

  // Kiểm tra xem cần hiển thị thông tin của người dùng nào
  const getDisplayUser = (conversation: Conversation) => {
    return userId === conversation.userOneId
      ? conversation.userTwo
      : conversation.userOne;
  };

  return (
    <div className="max-w-full w-full py-4 mx-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-120px)]">
        {/* Danh sách cuộc trò chuyện */}
        <div className="md:col-span-1 h-full overflow-hidden">
          <Card className="h-full flex flex-col">
            <CardContent className="p-3 pb-0 flex-1 overflow-hidden flex flex-col">
              <h2 className="font-medium mb-3">Cuộc trò chuyện</h2>

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
                <div className="text-center py-8 text-muted-foreground flex-1">
                  <p>Bạn chưa có cuộc trò chuyện nào</p>
                </div>
              ) : (
                <ScrollArea className="flex-1 h-0">
                  <div className="space-y-2 pr-4">
                    {conversations.map((conversation) => {
                      const displayUser = getDisplayUser(conversation);
                      const isUnread =
                        conversation.unreadCount > 0 &&
                        userId !== conversation.latestMessage?.senderId;
                      return (
                        <div
                          key={conversation.id}
                          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                            activeConversation?.id === conversation.id
                              ? "bg-muted"
                              : ""
                          } ${isUnread ? "bg-primary/5" : ""}`}
                          onClick={() => selectConversation(conversation)}
                        >
                          <Avatar>
                            <AvatarImage
                              src={displayUser.avatar || undefined}
                            />
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
        </div>

        {/* Khung chat */}
        <div className="md:col-span-2 h-full overflow-hidden">
          <Card className="h-full flex flex-col">
            {activeConversation ? (
              <>
                {/* Header của chat */}
                <div className="border-b py-3 px-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage
                        src={
                          getDisplayUser(activeConversation).avatar || undefined
                        }
                      />
                      <AvatarFallback>
                        <UserCircle className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {getDisplayUser(activeConversation).name}
                      </div>
                    </div>
                  </div>

                  {!socketConnected && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Loader2 className="animate-spin h-3 w-3 mr-1" />
                      Đang kết nối...
                    </div>
                  )}
                </div>

                {/* Tin nhắn */}
                <ScrollArea className="flex-1 px-6 py-4 h-0 w-full">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            index % 2 === 0 ? "justify-end" : ""
                          }`}
                        >
                          <Skeleton
                            className={`h-12 w-52 rounded-lg ${
                              index % 2 === 0 ? "bg-primary/20" : "bg-muted"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <p>Hãy bắt đầu cuộc trò chuyện...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      {messages.map((msg, index) => (
                        <div
                          key={`msg-${msg.id}-${index}`}
                          className={`flex ${
                            msg.senderId === userId
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          {msg.senderId !== userId && (
                            <Avatar className="h-8 w-8 mr-2 mt-1 hidden sm:block">
                              <AvatarImage
                                src={msg.sender.avatar || undefined}
                              />
                              <AvatarFallback>
                                <UserCircle className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-lg p-3 ${
                              msg.senderId === userId
                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                : "bg-muted rounded-tl-none"
                            }`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                            <div className="text-right mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                                {msg.senderId === userId && (
                                  <span className="ml-1">
                                    {msg.isRead ? "✓✓" : "✓"}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          {msg.senderId === userId && (
                            <Avatar className="h-8 w-8 ml-2 mt-1 hidden sm:block">
                              <AvatarImage
                                src={msg.sender.avatar || undefined}
                              />
                              <AvatarFallback>
                                <UserCircle className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Khung nhập tin nhắn */}
                <div className="border-t py-3 px-4 flex gap-2 mt-auto">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || !socketConnected}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full p-8 text-center text-muted-foreground">
                <div>
                  <h3 className="text-lg font-medium mb-2">
                    Chưa có cuộc trò chuyện nào được chọn
                  </h3>
                  <p>Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
