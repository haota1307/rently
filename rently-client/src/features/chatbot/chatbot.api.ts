import http from "@/lib/http";

interface ChatbotResponse {
  criteria?: {
    price: {
      min?: number;
      max?: number;
    } | null;
    amenities: string[];
    area: {
      min?: number;
      max?: number;
    } | null;
    address: string | null;
    userType: string | null;
    roomType: string | null;
  };
  summary: string;
  results: Array<{
    postId: number;
    roomId: number;
    rentalId: number;
    title: string;
    price: number;
    area: number;
    description: string;
    address: string;
    amenities: string[];
    imageUrls: string[];
    createdAt: string;
  }>;
  totalFound: number;
  error?: string;
}

const chatbotApiRequest = {
  search: (message: string) =>
    http.post<ChatbotResponse>("/chatbot", { message }),
};

export default chatbotApiRequest;
