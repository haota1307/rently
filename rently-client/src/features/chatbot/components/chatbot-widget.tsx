"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Move,
  MaximizeIcon,
  MinimizeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import chatbotApiRequest from "../chatbot.api";
// Tạm thời remove import DOMPurify để fix lỗi
// import DOMPurify from "dompurify";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  isHtml?: boolean;
}

// Hàm tạo ID duy nhất
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Mẫu tin nhắn chào mừng
const WELCOME_MESSAGE: Message = {
  id: generateUUID(),
  content:
    "Xin chào! Tôi là trợ lý ảo thông minh của Rently. Tôi có thể giúp bạn tìm phòng trọ lý tưởng, tư vấn về quy trình thuê phòng hoặc hướng dẫn đăng tin cho thuê. Hãy cho tôi biết bạn cần hỗ trợ gì nhé!",
  sender: "bot",
  timestamp: new Date(),
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const initialRenderRef = useRef(true);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Giữ auto-scroll khi đang loading
  useEffect(() => {
    if (isLoading && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isLoading]);

  // Lưu vị trí vào localStorage khi vị trí thay đổi
  useEffect(() => {
    if (position !== null && !isMaximized) {
      localStorage.setItem("chatbot-position", JSON.stringify(position));
    }
  }, [position, isMaximized]);

  // Lấy vị trí từ localStorage khi component mount
  useEffect(() => {
    const savedPosition = localStorage.getItem("chatbot-position");
    if (savedPosition) {
      try {
        setPosition(JSON.parse(savedPosition));
      } catch (error) {
        console.error("Error parsing saved position:", error);
        setPosition(null);
      }
    }
  }, []);

  // Đặt vị trí mặc định cho chat khi mở lần đầu và không có vị trí được lưu
  useEffect(() => {
    if (isOpen && position === null && !isMaximized && chatRef.current) {
      // Đặt vị trí ở góc phải dưới
      const { innerWidth, innerHeight } = window;
      const chatWidth = isExpanded ? 650 : 450;

      // Vị trí mặc định: góc phải dưới, lùi vào một chút từ mép màn hình
      setPosition({
        x: innerWidth - chatWidth - 50,
        y: innerHeight - 500,
      });
    }
  }, [isOpen, position, isMaximized, isExpanded]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    // Reset tin nhắn nếu chat đã đóng quá lâu (có thể thêm logic thời gian ở đây)
    if (messages.length === 0) {
      setMessages([{ ...WELCOME_MESSAGE, id: generateUUID() }]);
    }
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // Tạo HTML cho kết quả tìm kiếm - sử dụng template strings cẩn thận
  const generateSearchResultsHtml = (results: any[]): string => {
    if (!results || results.length === 0) {
      return `<p class="text-sm my-2">Không tìm thấy kết quả phù hợp.</p>`;
    }

    const resultsHtml = results
      .slice(0, 5)
      .map(
        (result, index) => `
        <div class="p-3 my-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900 hover:shadow-md transition-all duration-200">
          <a href="/bai-dang/${result.postId}" 
             target="_blank" 
             class="text-primary hover:text-primary/80 font-semibold transition-colors duration-200">
            ${index + 1}. ${result.title}
          </a>
          <div class="flex flex-wrap items-center gap-1 text-sm mt-2">
            <span class="font-bold text-green-600 dark:text-green-400">${new Intl.NumberFormat(
              "vi-VN"
            ).format(Number(result.price))} VNĐ/tháng</span> 
            <span class="mx-1">•</span>
            <span class="font-medium">${result.area}m²</span>
            <span class="mx-1">•</span>
            <span class="text-gray-600 dark:text-gray-300 truncate max-w-[200px]">${
              result.address
            }</span>
          </div>
          ${
            result.imageUrls && result.imageUrls.length > 0
              ? `<div class="mt-2 overflow-hidden rounded-md">
                   <img src="${result.imageUrls[0]}" alt="${result.title}" class="w-full h-32 object-cover hover:scale-105 transition-transform duration-500" />
                 </div>`
              : ""
          }
          <div class="text-xs mt-2 flex flex-wrap gap-1">
            ${result.amenities
              .map(
                (amenity: string) =>
                  `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-700 dark:text-blue-300">${amenity}</span>`
              )
              .join(" ")}
          </div>
        </div>
      `
      )
      .join("");

    return `
      <div class="space-y-2 my-3">
        ${resultsHtml}
      </div>
      <p class="text-sm mt-3 text-gray-600 dark:text-gray-300 italic">Bạn có thể nhấp vào tên phòng để xem chi tiết.</p>
    `;
  };

  // Thêm tin nhắn bot
  const addBotMessage = (options: { content: string; isHtml: boolean }) => {
    const botMessage: Message = {
      id: generateUUID(),
      content: options.content,
      sender: "bot",
      timestamp: new Date(),
      isHtml: options.isHtml,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  // Gửi tin nhắn đến API
  const sendMessageToApi = async (message: string) => {
    try {
      const { payload: data } = await chatbotApiRequest.search(message);
      return data;
    } catch (error) {
      console.error("Lỗi API:", error);
      throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
    }
  };

  // Xử lý gửi tin nhắn - Đơn giản hóa, luôn gửi tới API
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Thêm tin nhắn người dùng vào danh sách
    const userMessage: Message = {
      id: generateUUID(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      isHtml: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Luôn gửi mọi tin nhắn đến API
      const data = await sendMessageToApi(inputValue);

      if (data.error) {
        // Xử lý khi có lỗi từ API
        addBotMessage({
          content: `Xin lỗi, đã xảy ra lỗi: ${
            data.summary || data.error
          }. Vui lòng thử lại sau.`,
          isHtml: false,
        });
      } else if (data.results && data.results.length > 0) {
        // Có kết quả tìm kiếm phòng trọ
        const htmlContent = generateSearchResultsHtml(data.results);
        const summary = data.summary || "";
        addBotMessage({
          content: `${summary}<br/><br/>${htmlContent}`,
          isHtml: true,
        });
      } else {
        addBotMessage({
          content:
            data.summary ||
            "Tôi không hiểu câu hỏi của bạn. Bạn có thể hỏi về phòng trọ hoặc nhập yêu cầu tìm kiếm cụ thể hơn.",
          isHtml: false,
        });
      }
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      addBotMessage({
        content:
          "Xin lỗi, đã xảy ra lỗi khi xử lý tin nhắn của bạn. Vui lòng thử lại sau.",
        isHtml: false,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý phím Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  // Làm sạch văn bản HTML
  const sanitizeHtml = (html: string) => {
    // Tạm thời trả về HTML nguyên bản, sau này có thể thêm lại DOMPurify
    return html;
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-primary-foreground/20 p-0 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        onClick={toggleChat}
        aria-label={isOpen ? "Đóng trợ lý ảo" : "Mở trợ lý ảo"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <Sparkles className="h-6 w-6 absolute -top-2 -right-2 text-yellow-300 animate-pulse" />
            <MessageSquare className="h-6 w-6" />
          </div>
        )}
      </Button>

      {/* Cửa sổ chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            className={cn(
              "fixed z-50 overflow-hidden rounded-2xl border-2 border-primary/20 bg-background shadow-2xl",
              isMaximized
                ? "inset-6"
                : isExpanded
                ? "w-[650px] md:w-[750px] lg:w-[850px]"
                : "w-[450px] sm:w-[500px] md:w-[550px]"
            )}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{
              opacity: 1,
              scale: 1,
              ...(isMaximized
                ? { x: 0, y: 0 }
                : position
                ? { x: position.x, y: position.y }
                : { bottom: 100, right: 24, x: 0, y: 0 }),
            }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
              opacity: { duration: 0.2 },
              scale: { duration: 0.2 },
            }}
            drag={!isMaximized}
            dragConstraints={{
              left: -window.innerWidth + 200,
              right: window.innerWidth - 200,
              top: 10,
              bottom: window.innerHeight - 200,
            }}
            dragTransition={{
              power: 0.1,
              timeConstant: 200,
              modifyTarget: (target) => Math.round(target / 5) * 5,
            }}
            dragMomentum={false}
            dragListener={!isDragging}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false);

              // Chỉ cập nhật vị trí nếu đã di chuyển đủ xa để tránh lỗi nhấp chuột
              if (Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5) {
                if (position) {
                  setPosition({
                    x: position.x + info.offset.x,
                    y: position.y + info.offset.y,
                  });
                } else {
                  setPosition({
                    x: info.offset.x,
                    y: info.offset.y,
                  });
                }
              }
            }}
            style={{
              cursor: isDragging ? "grabbing" : "auto",
              willChange: "transform",
              pointerEvents: isDragging ? "none" : "auto",
            }}
          >
            {/* Header */}
            <div
              className="relative flex items-center justify-between border-b bg-gradient-to-r from-primary to-primary/70 p-3 text-primary-foreground cursor-move"
              onMouseDown={(e) => {
                if (!isMaximized && e.button === 0) {
                  // Chỉ xử lý với chuột trái và khi không ở chế độ toàn màn hình
                  const target = e.target as HTMLElement;
                  // Kiểm tra xem người dùng có nhấp vào nút hay không
                  if (target.closest("button")) {
                    return; // Bỏ qua nếu nhấp vào nút
                  }

                  // Khởi động sự kiện kéo theo cách thủ công
                  const chatElement = chatRef.current;
                  if (chatElement) {
                    const dragEvent = new MouseEvent("mousedown", {
                      clientX: e.clientX,
                      clientY: e.clientY,
                      bubbles: true,
                      cancelable: true,
                      view: window,
                    });

                    // Lan truyền sự kiện đến thành phần cha
                    chatElement.dispatchEvent(dragEvent);
                  }
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 bg-primary-foreground text-primary ring-2 ring-white/20 flex items-center justify-center">
                    <AvatarFallback>
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-primary"></span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Rently Assistant</h3>
                  <p className="text-xs opacity-90">
                    Trợ lý ảo thông minh hỗ trợ 24/7
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMaximize}
                  className="text-primary-foreground hover:bg-primary/90"
                  aria-label={
                    isMaximized ? "Thu nhỏ cửa sổ chat" : "Phóng to cửa sổ chat"
                  }
                >
                  {isMaximized ? (
                    <MinimizeIcon className="h-5 w-5" />
                  ) : (
                    <MaximizeIcon className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpand}
                  className="text-primary-foreground hover:bg-primary/90"
                  aria-label={
                    isExpanded ? "Thu nhỏ cửa sổ chat" : "Mở rộng cửa sổ chat"
                  }
                >
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronUp className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleChat}
                  className="text-primary-foreground hover:bg-primary/90"
                  aria-label="Đóng cửa sổ chat"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              {!isMaximized && (
                <div
                  className={cn(
                    "absolute -top-1 left-1/2 transform -translate-x-1/2 bg-primary px-2 py-1 rounded-b-md text-xs text-primary-foreground flex items-center gap-1 transition-opacity",
                    isDragging ? "opacity-100" : "opacity-0 hover:opacity-70"
                  )}
                >
                  <Move className="h-3 w-3" />
                  <span>Kéo để di chuyển</span>
                </div>
              )}
            </div>

            {/* Chat messages */}
            <ScrollArea
              className={cn(
                "p-4 overflow-y-auto",
                isMaximized
                  ? "h-[calc(100%-150px)]"
                  : isExpanded
                  ? "h-[350px]"
                  : "h-[300px]"
              )}
              ref={scrollAreaRef}
            >
              <div className="flex flex-col gap-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "flex max-w-[85%] flex-col rounded-xl p-4",
                      message.sender === "user"
                        ? "ml-auto bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
                        : "bg-gradient-to-r from-muted/60 to-muted shadow-sm"
                    )}
                  >
                    {message.isHtml ? (
                      <div
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(message.content),
                        }}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {message.content}
                      </p>
                    )}
                    <span className="mt-2 text-right text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex max-w-[85%] flex-col rounded-xl p-4 bg-muted/60"
                  >
                    <div className="flex space-x-2">
                      <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary/60"></div>
                      <div
                        className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary/60"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary/60"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} className="h-1" />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="flex items-center gap-2 border-t bg-muted/30 p-3">
              <Input
                placeholder="Nhập tin nhắn của bạn..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-xl border-muted-foreground/20 bg-background px-4 py-3 shadow-sm focus:border-primary focus:ring-primary"
                disabled={isLoading}
                aria-label="Nhập tin nhắn"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/80 transition-colors"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                aria-label="Gửi tin nhắn"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>

            {/* Gợi ý nhanh */}
            <div className="border-t bg-muted/10 p-2 flex flex-wrap gap-2 justify-center">
              {[
                "Tìm phòng giá rẻ",
                "Hướng dẫn đăng bài",
                "Kinh nghiệm thuê phòng",
                "Phòng gần trường đại học",
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="bg-background hover:bg-muted/50 text-xs py-0.5 h-auto rounded-full"
                  onClick={() => {
                    setInputValue(suggestion);
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
