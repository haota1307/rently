"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AnimatePresence, motion, useSpring } from "framer-motion";
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
  Loader2,
  User,
  CornerRightDown,
  AlignJustify,
  RefreshCw,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import chatbotApiRequest from "../chatbot.api";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getAccessTokenFromLocalStorage } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

// Hàm chuyển đổi từ dữ liệu API sang định dạng tin nhắn nội bộ
const convertHistoryToMessages = (historyItems: any[]): Message[] => {
  const messages: Message[] = [];

  historyItems.forEach((item) => {
    // Thêm tin nhắn người dùng
    messages.push({
      id: `user_${item.id}`,
      content: item.message,
      sender: "user",
      timestamp: new Date(item.createdAt),
    });

    // Thêm phản hồi của bot
    messages.push({
      id: `bot_${item.id}`,
      content: item.response,
      sender: "bot",
      timestamp: new Date(item.createdAt),
      isHtml: item.response.includes("<") && item.response.includes(">"),
    });
  });

  // Sắp xếp tin nhắn theo thời gian tăng dần
  return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyLimit] = useState(10);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const initialRenderRef = useRef(true);
  const isMobile = useMediaQuery("(max-width: 640px)");
  const scrollListenerRef = useRef<any>(null);
  const buttonSpring = useSpring(0);

  // Animation khi mở chatbot
  useEffect(() => {
    buttonSpring.set(isOpen ? 1 : 0);
  }, [isOpen, buttonSpring]);

  // Thêm fetch lịch sử tin nhắn khi mở chatbot
  const fetchHistory = useCallback(
    async (offset: number = 0, limit: number = historyLimit) => {
      try {
        // Kiểm tra người dùng đã đăng nhập chưa thông qua access token
        const accessToken = getAccessTokenFromLocalStorage();
        const isLoggedIn = !!accessToken;

        // Nếu không đăng nhập, chỉ hiển thị tin nhắn chào mừng
        if (!isLoggedIn) {
          setShowWelcomeMessage(true);
          setMessages(showWelcomeMessage ? [WELCOME_MESSAGE] : []);
          setHasMoreHistory(false);
          return;
        }

        setIsLoadingHistory(true);
        const { payload: data } = await chatbotApiRequest.getHistory(
          limit,
          offset
        );

        if (data.messages.length > 0) {
          const historyMessages = convertHistoryToMessages(data.messages);

          setMessages((prevMessages) => {
            // Nếu đang load trang đầu tiên hoặc chưa có tin nhắn
            if (offset === 0) {
              // Chỉ hiển thị welcome message nếu chưa có lịch sử
              setShowWelcomeMessage(data.messages.length === 0);
              return [...historyMessages];
            } else {
              // Thêm tin nhắn cũ vào đầu danh sách
              return [...historyMessages, ...prevMessages];
            }
          });

          setHistoryOffset(offset + data.messages.length);
          setHasMoreHistory(data.hasMore);
        } else {
          // Không có lịch sử, hiển thị welcome message
          if (offset === 0) {
            setShowWelcomeMessage(true);
            setMessages(showWelcomeMessage ? [WELCOME_MESSAGE] : []);
          }
          setHasMoreHistory(false);
        }
      } catch (error) {
        console.error("Lỗi khi tải lịch sử chat:", error);
        // Hiển thị welcome message nếu không load được lịch sử
        if (offset === 0 && messages.length === 0) {
          setShowWelcomeMessage(true);
          setMessages(showWelcomeMessage ? [WELCOME_MESSAGE] : []);
        }
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [historyLimit, showWelcomeMessage]
  );

  // Load lịch sử khi mở chat
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchHistory(0);
    }
  }, [isOpen, fetchHistory, messages.length]);

  // Tự động cuộn xuống khi có tin nhắn mới
  useEffect(() => {
    if (messagesEndRef.current && !isLoadingHistory) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoadingHistory]);

  // Infinite scroll để tải thêm tin nhắn cũ
  useEffect(() => {
    const scrollListener = (event: Event) => {
      const target = event.target as HTMLDivElement;
      if (target.scrollTop <= 50 && !isLoadingHistory && hasMoreHistory) {
        fetchHistory(historyOffset);
      }
    };

    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollArea) {
      scrollArea.addEventListener("scroll", scrollListener);
      scrollListenerRef.current = scrollListener;
    }

    return () => {
      if (scrollArea && scrollListenerRef.current) {
        scrollArea.removeEventListener("scroll", scrollListenerRef.current);
      }
    };
  }, [fetchHistory, hasMoreHistory, historyOffset, isLoadingHistory]);

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

      // Trên thiết bị di động, đặt ở một vị trí khác so với desktop
      if (isMobile) {
        setPosition({
          x: innerWidth - 320 - 16, // Điều chỉnh kích thước và khoảng cách cho phù hợp hơn
          y: innerHeight - 450,
        });
      } else {
        // Vị trí mặc định: góc phải dưới, lùi vào một chút từ mép màn hình
        setPosition({
          x: innerWidth - chatWidth - 50,
          y: innerHeight - 500,
        });
      }
    }
  }, [isOpen, position, isMaximized, isExpanded, isMobile]);

  // Tự động tối đa hóa trên thiết bị di động
  useEffect(() => {
    if (isMobile && isOpen) {
      setIsMaximized(true);
    }
  }, [isMobile, isOpen]);

  // Tự động đặt lại kích thước phù hợp khi mở chatbot trên điện thoại
  useEffect(() => {
    if (isMobile && isOpen) {
      // Reset các kích thước và vị trí để tránh bị khuất
      setPosition(null);
    }
  }, [isMobile, isOpen]);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
    // Nếu mở lại chat và chưa có tin nhắn, tải lịch sử
    if (!isOpen && messages.length === 0) {
      fetchHistory(0);
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
        <div class="p-1.5 sm:p-3 my-1.5 sm:my-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900 hover:shadow-md transition-all duration-200">
          <a href="/bai-dang/${result.postId}" 
             target="_blank" 
             class="text-primary hover:text-primary/80 font-semibold transition-colors duration-200 text-[11px] sm:text-sm">
            ${index + 1}. ${result.title}
          </a>
          <div class="flex flex-wrap items-center gap-1 text-[10px] sm:text-xs mt-1 sm:mt-2">
            <span class="font-bold text-green-600 dark:text-green-400">${new Intl.NumberFormat(
              "vi-VN"
            ).format(Number(result.price))} VNĐ/tháng</span> 
            <span class="mx-1">•</span>
            <span class="font-medium">${result.area}m²</span>
            <span class="mx-1">•</span>
            <span class="text-gray-600 dark:text-gray-300 truncate max-w-[120px] sm:max-w-[200px]">${
              result.address
            }</span>
          </div>
          ${
            result.imageUrls && result.imageUrls.length > 0
              ? `<div class="mt-1 sm:mt-2 overflow-hidden rounded-md">
                   <img src="${result.imageUrls[0]}" alt="${result.title}" class="w-full h-20 sm:h-32 object-cover hover:scale-105 transition-transform duration-500" />
                 </div>`
              : ""
          }
          <div class="text-[8px] sm:text-xs mt-1 sm:mt-2 flex flex-wrap gap-0.5 sm:gap-1">
            ${result.amenities
              .map(
                (amenity: string) =>
                  `<span class="px-1 py-0.5 sm:px-2 sm:py-1 bg-blue-100 dark:bg-blue-900/50 rounded-full text-blue-700 dark:text-blue-300">${amenity}</span>`
              )
              .join(" ")}
          </div>
        </div>
      `
      )
      .join("");

    return `
      <div class="space-y-1 sm:space-y-2 my-1.5 sm:my-3">
        ${resultsHtml}
      </div>
      <p class="text-[9px] sm:text-sm mt-1.5 sm:mt-3 text-gray-600 dark:text-gray-300 italic">Bạn có thể nhấp vào tên phòng để xem chi tiết.</p>
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

  // Xử lý gửi tin nhắn
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
      // Gửi tin nhắn đến API
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

  // Render nút trigger chatbot
  const renderChatButton = () => (
    <motion.div
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", duration: 0.5 }}
    >
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full p-0 shadow-lg hover:shadow-xl transition-all duration-300",
                isOpen
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-primary hover:bg-primary/90"
              )}
              onClick={toggleChat}
              aria-label={isOpen ? "Đóng trợ lý ảo" : "Mở trợ lý ảo"}
            >
              <motion.div
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isOpen ? (
                  <X className="h-6 w-6 text-white" />
                ) : (
                  <div className="relative">
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 2,
                        ease: "easeInOut",
                      }}
                    >
                      <MessageSquare className="h-6 w-6 text-white" />
                      <motion.div
                        className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [1, 0.7, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.5,
                        }}
                      />
                    </motion.div>
                  </div>
                )}
              </motion.div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="font-medium">
            {isOpen ? "Đóng trợ lý ảo" : "Trò chuyện với Rently Assistant"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );

  // Render cửa sổ chat
  const renderChatWindow = () => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={chatRef}
          className={cn(
            "fixed flex flex-col z-[9999999] overflow-hidden rounded-xl border-2 border-primary/20 bg-white dark:bg-slate-900 shadow-xl",
            isMaximized
              ? isMobile
                ? "inset-x-0 top-0 bottom-auto h-[85vh] m-2 rounded-lg" // Giới hạn chiều cao trên mobile 85% màn hình
                : "inset-6"
              : isExpanded
              ? "w-[85vw] sm:w-[600px] md:w-[650px] lg:w-[700px] max-h-[80vh]"
              : "w-[85vw] sm:w-[400px] md:w-[450px] max-h-[80vh]"
          )}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            ...(isMaximized
              ? { x: 0, y: 0 }
              : position
              ? { x: position.x, y: position.y }
              : { bottom: 80, right: 20, x: 0, y: 0 }),
          }}
          exit={{ opacity: 0, y: 30, scale: 0.9 }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 300,
            duration: 0.3,
          }}
          drag={!isMaximized && !isMobile}
          dragConstraints={{
            left: -window.innerWidth + 200,
            right: window.innerWidth - 200,
            top: 10,
            bottom: window.innerHeight - 200,
          }}
          dragMomentum={false}
          dragListener={!isDragging && !isMobile}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e, info) => {
            setIsDragging(false);

            // Chỉ cập nhật vị trí nếu đã di chuyển đủ xa
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
        >
          {/* Header */}
          <header className="relative flex items-center justify-between p-3 sm:p-4 border-b bg-primary text-white cursor-move">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-10 w-10 bg-white text-primary ring-2 ring-white/20">
                  <AvatarFallback className="bg-white text-primary font-bold">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-1 ring-white"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.7, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Rently Assistant</h3>
                <p className="text-xs text-white/80">Trợ lý ảo thông minh</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isMobile && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMaximize}
                    className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                    aria-label={isMaximized ? "Thu nhỏ" : "Phóng to"}
                  >
                    {isMaximized ? (
                      <MinimizeIcon className="h-4 w-4" />
                    ) : (
                      <MaximizeIcon className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleExpand}
                    className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                    aria-label={isExpanded ? "Thu nhỏ" : "Mở rộng"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="text-white hover:bg-white/20 h-8 w-8 rounded-full"
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {!isMaximized && !isMobile && (
              <motion.div
                className={cn(
                  "absolute -top-1 left-1/2 transform -translate-x-1/2 bg-primary px-2 py-1 rounded-b-md text-xs text-white flex items-center gap-1",
                  isDragging ? "opacity-100" : "opacity-0 hover:opacity-70"
                )}
                initial={{ y: -10, opacity: 0 }}
                animate={{
                  y: isDragging ? 0 : -10,
                  opacity: isDragging ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              >
                <Move className="h-3 w-3" />
                <span className="text-xs">Kéo để di chuyển</span>
              </motion.div>
            )}
          </header>

          {/* Khu vực tin nhắn */}
          <ScrollArea
            ref={scrollAreaRef}
            className={cn(
              "flex-1 overflow-auto py-4 px-3 sm:px-4 bg-gray-50 dark:bg-slate-800",
              isDragging ? "pointer-events-none select-none" : ""
            )}
          >
            {/* Loading indicator cho lịch sử */}
            {isLoadingHistory && historyOffset > 0 && (
              <motion.div
                className="flex justify-center my-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-2 text-xs bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full shadow-sm">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Đang tải tin nhắn cũ...</span>
                </div>
              </motion.div>
            )}

            {/* Thông báo khi không còn tin nhắn cũ */}
            {!isLoadingHistory && !hasMoreHistory && historyOffset > 0 && (
              <motion.div
                className="flex justify-center my-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="text-xs bg-white dark:bg-slate-700 px-3 py-1.5 rounded-full">
                  Đã hiển thị tất cả tin nhắn
                </div>
              </motion.div>
            )}

            {/* Hiển thị welcome message nếu cần */}
            {showWelcomeMessage && messages.length === 0 && (
              <motion.div
                className="flex mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[85%]">
                    <div className="bg-white dark:bg-slate-700 p-3 sm:p-4 rounded-lg rounded-tl-none mb-1 shadow-sm border border-gray-100 dark:border-slate-600">
                      <p className="text-sm sm:text-base text-gray-800 dark:text-gray-100">
                        {WELCOME_MESSAGE.content}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Hiển thị tin nhắn */}
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                className={cn(
                  "mb-6",
                  message.sender === "user" ? "flex justify-end" : "flex"
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(index * 0.05, 0.3),
                }}
              >
                {message.sender === "bot" && (
                  <Avatar className="h-9 w-9 mr-3 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-white">
                      <Bot className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    "max-w-[85%]",
                    message.sender === "user" && "flex flex-col items-end"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 sm:p-4 rounded-lg mb-1 shadow-sm border",
                      message.sender === "user"
                        ? "bg-primary text-white rounded-br-none border-primary/40"
                        : "bg-white dark:bg-slate-700 rounded-tl-none border-gray-100 dark:border-slate-600"
                    )}
                  >
                    {message.isHtml ? (
                      <div
                        className="text-sm sm:text-base prose dark:prose-invert max-w-full prose-img:my-0 prose-headings:mb-1 prose-p:my-1"
                        dangerouslySetInnerHTML={{
                          __html: sanitizeHtml(message.content),
                        }}
                      />
                    ) : (
                      <p
                        className={cn(
                          "text-sm sm:text-base whitespace-pre-wrap",
                          message.sender === "user"
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-100"
                        )}
                      >
                        {message.content}
                      </p>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-xs text-gray-500 dark:text-gray-400",
                      message.sender === "user" ? "mr-1" : "ml-1"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {message.sender === "user" && (
                  <Avatar className="h-9 w-9 ml-3 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}

            {/* Hiệu ứng đang gõ */}
            {isLoading && (
              <motion.div
                className="flex mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Avatar className="h-9 w-9 mr-3 mt-1">
                  <AvatarFallback className="bg-primary text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[85%]">
                  <div className="bg-white dark:bg-slate-700 p-3 sm:p-4 rounded-lg rounded-tl-none mb-1 shadow-sm border border-gray-100 dark:border-slate-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.2s]" />
                      <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Vùng nhập liệu */}
          <div className="flex items-center gap-2 p-3 sm:p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <Input
              placeholder="Nhập tin nhắn..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 rounded-full border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-800 px-4 py-3 text-sm sm:text-base shadow-sm focus-visible:ring-primary"
              disabled={isLoading}
            />
            <Button
              size="icon"
              className={cn(
                "h-10 w-10 sm:h-12 sm:w-12 rounded-full transition-colors shadow-sm",
                inputValue.trim()
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              )}
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Return final của component
  return (
    <>
      {renderChatButton()}
      {renderChatWindow()}
    </>
  );
}
