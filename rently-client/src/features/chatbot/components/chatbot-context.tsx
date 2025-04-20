"use client";

/**
 * @deprecated Phiên bản chatbot đơn giản này đã được thay thế bởi chatbot-widget.tsx.
 * Hãy sử dụng ChatbotWidget thay vì ChatProvider và useChat.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatbotContextType {
  isOpen: boolean;
  messages: Message[];
  toggleChat: () => void;
  sendMessage: (content: string) => void;
  clearMessages: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

/**
 * @deprecated Sử dụng ChatbotWidget từ chatbot-widget.tsx
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  console.warn(
    "ChatProvider đã bị deprecated. Hãy sử dụng ChatbotWidget từ chatbot-widget.tsx"
  );

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Xin chào! Tôi là trợ lý ảo của Rently. Tôi có thể giúp gì cho bạn?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const sendMessage = (content: string) => {
    if (!content.trim()) return;

    // Thêm tin nhắn của người dùng
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Giả lập phản hồi từ bot sau 1 giây
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(content),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const clearMessages = () => {
    setMessages([
      {
        id: "welcome",
        content:
          "Xin chào! Tôi là trợ lý ảo của Rently. Tôi có thể giúp gì cho bạn?",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
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
      return "Bạn có thể liên hệ với chúng tôi qua số điện thoại: 0123 456 789 hoặc email: support@rently.vn";
    }

    if (lowerCaseMessage.includes("cảm ơn")) {
      return "Không có gì! Rất vui được giúp đỡ bạn.";
    }

    return "Xin lỗi, tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về giá phòng, cách liên hệ hoặc các dịch vụ khác của chúng tôi.";
  };

  return (
    <ChatbotContext.Provider
      value={{
        isOpen,
        messages,
        toggleChat,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </ChatbotContext.Provider>
  );
}

/**
 * @deprecated Sử dụng ChatbotWidget từ chatbot-widget.tsx
 */
export function useChat() {
  console.warn(
    "useChat đã bị deprecated. Hãy sử dụng ChatbotWidget từ chatbot-widget.tsx"
  );

  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
