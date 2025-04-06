"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import chatbotApiRequest from "../chatbot.api";

interface Message {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  isHtml?: boolean;
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Xin chào! Tôi là trợ lý ảo của Rently. Tôi có thể giúp bạn tìm phòng trọ phù hợp. Hãy cho tôi biết nhu cầu của bạn!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  // Kiểm tra xem có phải tin nhắn đơn giản không
  const isSimpleMessage = (text: string): boolean => {
    const lowerMessage = text.toLowerCase().trim();

    // Lời chào và giới thiệu
    if (
      /^((xin\s)?chào|hi|hello|hey|good morning|good afternoon)\b/i.test(
        lowerMessage
      ) &&
      lowerMessage.length < 30
    ) {
      return true;
    }

    // Cảm ơn
    if (
      /^(cảm ơn|thank|thanks|cám ơn|tks)\b/i.test(lowerMessage) &&
      lowerMessage.length < 30
    ) {
      return true;
    }

    // Hỏi thăm
    if (
      /bạn có khỏe không|khỏe không|how are you|thế nào|dạo này/i.test(
        lowerMessage
      )
    ) {
      return true;
    }

    // Tâm trạng người dùng
    if (
      /tôi (cảm thấy|đang|thấy) (buồn|vui|chán|mệt|tuyệt)/i.test(lowerMessage)
    ) {
      return true;
    }

    // Câu hỏi về chatbot
    if (
      /bạn (là ai|là gì|tên gì|bao nhiêu tuổi|sống ở đâu|thích gì|có thể làm gì)/i.test(
        lowerMessage
      )
    ) {
      return true;
    }

    // Cần thêm thông tin về tiện ích nhưng không phải tìm kiếm
    if (
      /tiện ích|máy lạnh|internet|wifi|điện nước|ban công|giặt ủi|nấu ăn|bếp|toilet/i.test(
        lowerMessage
      ) &&
      !/tìm phòng|thuê phòng|gợi ý|cần|muốn thuê/i.test(lowerMessage)
    ) {
      return true;
    }

    // Câu hỏi về tư vấn
    if (
      /tư vấn|lời khuyên|nên thuê|kinh nghiệm|lưu ý/i.test(lowerMessage) &&
      !/tìm phòng|thuê phòng|phòng trọ|gợi ý/i.test(lowerMessage)
    ) {
      return true;
    }

    return false;
  };

  // Xử lý tin nhắn đơn giản
  const handleSimpleMessage = (text: string) => {
    const lowerMessage = text.toLowerCase().trim();
    let response = "";

    // Lời chào và giới thiệu
    if (
      /^((xin\s)?chào|hi|hello|hey|good morning|good afternoon)\b/i.test(
        lowerMessage
      )
    ) {
      response =
        "Chào bạn! Rất vui được trò chuyện với bạn hôm nay. Tôi có thể giúp gì cho bạn?";
    }
    // Cảm ơn
    else if (/^(cảm ơn|thank|thanks|cám ơn|tks)\b/i.test(lowerMessage)) {
      const responses = [
        "Không có gì đâu bạn. Rất vui được giúp đỡ!",
        "Rất vui vì tôi có thể giúp được bạn!",
        "Đó là nhiệm vụ của tôi mà. Cần gì cứ hỏi nhé!",
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }
    // Hỏi thăm
    else if (
      /bạn có khỏe không|khỏe không|how are you|thế nào|dạo này/i.test(
        lowerMessage
      )
    ) {
      response =
        "Tôi là trợ lý ảo nên lúc nào cũng khỏe bạn ạ! Cảm ơn bạn đã quan tâm. Bạn có khỏe không?";
    }
    // Tâm trạng người dùng
    else if (
      /tôi (cảm thấy|đang|thấy) (buồn|vui|chán|mệt|tuyệt)/i.test(lowerMessage)
    ) {
      if (/buồn|chán|mệt/i.test(lowerMessage)) {
        response =
          "Tôi hiểu cảm giác của bạn. Đôi khi việc tìm phòng trọ có thể hơi mệt mỏi, nhưng đừng lo, tôi sẽ giúp bạn tìm được nơi ở phù hợp!";
      } else {
        response =
          "Thật tốt khi bạn đang cảm thấy tích cực! Tôi tin rằng chúng ta sẽ sớm tìm được phòng trọ ưng ý cho bạn.";
      }
    }
    // Câu hỏi về chatbot
    else if (
      /bạn (là ai|là gì|tên gì|bao nhiêu tuổi|sống ở đâu|thích gì|có thể làm gì)/i.test(
        lowerMessage
      )
    ) {
      if (/là ai|là gì|tên gì/i.test(lowerMessage)) {
        response =
          "Tôi là Rently Assistant, trợ lý ảo được tạo ra để giúp bạn tìm kiếm và tư vấn về phòng trọ. Tôi có thể trò chuyện và giúp bạn tìm phòng phù hợp với nhu cầu của bạn!";
      } else if (/bao nhiêu tuổi/i.test(lowerMessage)) {
        response =
          "Tôi còn khá trẻ, mới được tạo ra gần đây thôi! Nhưng kiến thức của tôi về thị trường phòng trọ được cập nhật liên tục.";
      } else if (/sống ở đâu/i.test(lowerMessage)) {
        response =
          "Tôi sống trong hệ thống máy chủ của Rently, luôn sẵn sàng giúp đỡ bạn 24/7!";
      } else if (/thích gì/i.test(lowerMessage)) {
        response =
          "Tôi thích nhất là khi giúp người dùng tìm được căn phòng ưng ý! Cảm giác rất tuyệt vời khi được giúp đỡ mọi người.";
      } else {
        response =
          "Tôi có thể giúp bạn tìm phòng trọ theo yêu cầu, trả lời các câu hỏi về thị trường nhà trọ, và trò chuyện thân thiện với bạn!";
      }
    }
    // Câu hỏi về tiện ích
    else if (
      /tiện ích|máy lạnh|internet|wifi|điện nước|ban công|giặt ủi|nấu ăn|bếp|toilet/i.test(
        lowerMessage
      )
    ) {
      response =
        "Các tiện ích phổ biến trong phòng trọ bao gồm: WiFi, máy lạnh, tủ lạnh, máy giặt, ban công, bếp, toilet riêng. Một số phòng cao cấp còn có thêm bảo vệ 24/7, thang máy, và đỗ xe. Bạn quan tâm đến những tiện ích nào nhất?";
    }
    // Câu hỏi về tư vấn
    else if (
      /tư vấn|lời khuyên|nên thuê|kinh nghiệm|lưu ý/i.test(lowerMessage)
    ) {
      response =
        "Khi thuê phòng, bạn nên lưu ý:\n1. Kiểm tra kỹ hợp đồng trước khi ký\n2. Xác nhận các khoản phí phụ thu (điện, nước, internet)\n3. Kiểm tra an ninh khu vực\n4. Đảm bảo các thiết bị trong phòng hoạt động tốt\n5. Chụp ảnh hiện trạng phòng trước khi chuyển vào\nBạn cần tư vấn cụ thể về vấn đề nào?";
    }

    addBotMessage({
      content: response,
      isHtml: false,
    });
  };

  // Tạo HTML cho kết quả tìm kiếm
  const generateSearchResultsHtml = (results: any[]): string => {
    return `
      <div class="space-y-3 my-2">
        ${results
          .slice(0, 3)
          .map(
            (result, index) => `
          <div class="p-2 bg-muted/50 rounded-md">
            <a href="/bai-dang/${
              result.postId
            }" target="_blank" class="text-primary hover:underline font-medium">
              ${index + 1}. ${result.title}
            </a>
            <div class="text-sm mt-1">
              <span class="font-medium">${new Intl.NumberFormat("vi-VN").format(
                Number(result.price)
              )} VNĐ/tháng</span> - 
              ${result.area}m² - ${result.address}
            </div>
            <div class="text-xs mt-1">
              <span class="font-medium">Tiện ích:</span> ${result.amenities.join(
                ", "
              )}
            </div>
          </div>
        `
          )
          .join("")}
      </div>
      <p class="text-sm mt-2">Bạn có thể nhấp vào tên phòng để xem chi tiết.</p>
    `;
  };

  // Thêm tin nhắn bot
  const addBotMessage = (options: { content: string; isHtml: boolean }) => {
    const botMessage: Message = {
      id: Date.now().toString(),
      content: options.content,
      sender: "bot",
      timestamp: new Date(),
      isHtml: options.isHtml,
    };
    setMessages((prev) => [...prev, botMessage]);
  };

  // Gửi tin nhắn đến API
  const sendMessage = async (message: string) => {
    const { payload: data } = await chatbotApiRequest.search(message);
    return data;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Thêm tin nhắn người dùng vào danh sách
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
      isHtml: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Kiểm tra xem có phải tin nhắn đơn giản không
      if (isSimpleMessage(inputValue)) {
        // Với tin nhắn đơn giản, không cần gọi API
        handleSimpleMessage(inputValue);
      } else {
        // Với tin nhắn yêu cầu tìm kiếm, gọi API
        const data = await sendMessage(inputValue);

        if (data.error) {
          // Xử lý khi có lỗi từ API
          addBotMessage({
            content: `Xin lỗi, đã xảy ra lỗi: ${
              data.summary || data.error
            }. Vui lòng thử lại sau.`,
            isHtml: false,
          });
        } else if (data.results.length === 0) {
          // Không tìm thấy kết quả
          addBotMessage({
            content: data.summary,
            isHtml: false,
          });
        } else {
          // Tìm thấy kết quả
          const htmlContent = generateSearchResultsHtml(data.results);
          addBotMessage({
            content: `${data.summary}<br/><br/>${htmlContent}`,
            isHtml: true,
          });
        }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary p-0 text-primary-foreground shadow-lg"
        onClick={toggleChat}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </Button>

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
                    {message.isHtml ? (
                      <div
                        className="text-sm"
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-line">
                        {message.content}
                      </p>
                    )}
                    <span className="mt-1 text-right text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex max-w-[80%] flex-col rounded-lg p-3 bg-muted">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                )}
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
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
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
