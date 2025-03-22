"use client";

import type React from "react";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Xin chào! Tôi là trợ lý ảo của Rently. Tôi có thể giúp gì cho bạn?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Thêm tin nhắn của người dùng
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Giả lập phản hồi từ bot sau 1 giây
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  // Hàm giả lập phản hồi từ bot dựa trên tin nhắn của người dùng
  const getBotResponse = (message: string): string => {
    const lowerCaseMessage = message.toLowerCase();

    if (
      lowerCaseMessage.includes("xin chào") ||
      lowerCaseMessage.includes("hello")
    ) {
      return "Xin chào! Tôi có thể giúp gì cho bạn?";
    }

    if (
      lowerCaseMessage.includes("giá") ||
      lowerCaseMessage.includes("phòng")
    ) {
      return "Chúng tôi có nhiều loại phòng với giá từ 2 triệu đến 5 triệu đồng/tháng. Bạn có thể tìm kiếm phòng phù hợp trên trang chủ của chúng tôi.";
    }

    if (
      lowerCaseMessage.includes("liên hệ") ||
      lowerCaseMessage.includes("hotline")
    ) {
      return "Bạn có thể liên hệ với chúng tôi qua số điện thoại: 0123 456 789 hoặc email: support@thuetro.vn";
    }

    if (lowerCaseMessage.includes("cảm ơn")) {
      return "Không có gì! Rất vui được giúp đỡ bạn.";
    }

    return "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về giá phòng, cách liên hệ hoặc các dịch vụ khác của chúng tôi.";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Bong bóng chat */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={toggleChat}
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            isOpen
              ? "bg-red-500 hover:bg-red-600"
              : "bg-primary hover:bg-primary/90"
          )}
          aria-label={isOpen ? "Đóng chat" : "Mở chat"}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </Button>
      </motion.div>

      {/* Modal chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-80 overflow-hidden rounded-lg border bg-background shadow-xl sm:w-96"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-primary p-4 text-primary-foreground">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 bg-primary-foreground text-primary flex items-center justify-center">
                  <Bot className="h-4 w-4" />
                </Avatar>
                <div>
                  <h3 className="font-medium">Rently Assistant</h3>
                  <p className="text-xs opacity-80">Trợ lý ảo hỗ trợ 24/7</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="text-primary-foreground hover:bg-primary/90"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat messages */}
            <ScrollArea className="h-80 p-4">
              <div className="flex flex-col gap-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex max-w-[80%] flex-col rounded-lg p-3",
                      message.sender === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <span className="mt-1 text-right text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="flex items-center gap-2 border-t p-3">
              <Input
                placeholder="Nhập tin nhắn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
