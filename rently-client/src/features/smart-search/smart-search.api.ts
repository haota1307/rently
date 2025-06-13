import http from "@/lib/http";

export interface SmartSearchRequest {
  query: string;
  filters?: {
    price?: {
      min?: number;
      max?: number;
    };
    area?: {
      min?: number;
      max?: number;
    };
    amenities?: string[];
    address?: string;
  };
}

export interface SmartSearchResponse {
  originalQuery: string;
  extractedCriteria: any;
  intent: string;
  results: Array<{
    id: number;
    title: string;
    address: string;
    price: number;
    area: number;
    images: string[];
    amenities: string[];
    matchScore: number;
    isRecommended: boolean;
  }>;
  totalFound: number;
  summary: string;
  suggestions: {
    suggestions: string[];
  };
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

export interface QueryAnalysisResponse {
  query: string;
  intent: string;
  criteria: any;
  summary: string;
}

export const smartSearchApi = {
  search: async (data: SmartSearchRequest): Promise<SmartSearchResponse> => {
    const response = await http.post("/smart-search", data);
    return response.payload as SmartSearchResponse;
  },

  getSuggestions: async (query: string): Promise<SearchSuggestionsResponse> => {
    const response = await http.get(
      `/smart-search/suggestions?q=${encodeURIComponent(query)}`
    );
    return response.payload as SearchSuggestionsResponse;
  },

  analyzeQuery: async (query: string): Promise<QueryAnalysisResponse> => {
    const response = await http.post("/smart-search/analyze", { query });
    return response.payload as QueryAnalysisResponse;
  },
};
