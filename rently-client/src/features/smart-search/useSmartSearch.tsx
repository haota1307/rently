import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { smartSearchApi, SmartSearchRequest } from "./smart-search.api";
import { useDebounce } from "@/hooks/use-debounce";
import { useState, useCallback } from "react";

export const SMART_SEARCH_KEYS = {
  all: ["smart-search"] as const,
  search: (query: string) => ["smart-search", "search", query] as const,
  suggestions: (query: string) =>
    ["smart-search", "suggestions", query] as const,
  analysis: (query: string) => ["smart-search", "analysis", query] as const,
};

export function useSmartSearch() {
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: smartSearchApi.search,
    onSuccess: (data) => {
      // Cache kết quả tìm kiếm
      queryClient.setQueryData(
        SMART_SEARCH_KEYS.search(data.originalQuery),
        data
      );
    },
  });

  const search = useCallback(
    (request: SmartSearchRequest) => {
      return searchMutation.mutateAsync(request);
    },
    [searchMutation]
  );

  return {
    search,
    isLoading: searchMutation.isPending,
    error: searchMutation.error,
    data: searchMutation.data,
    reset: searchMutation.reset,
  };
}

export function useSearchSuggestions(query: string, enabled = true) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: SMART_SEARCH_KEYS.suggestions(debouncedQuery),
    queryFn: () => smartSearchApi.getSuggestions(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: false,
  });
}

export function useQueryAnalysis(query: string, enabled = true) {
  const debouncedQuery = useDebounce(query, 500);

  return useQuery({
    queryKey: SMART_SEARCH_KEYS.analysis(debouncedQuery),
    queryFn: () => smartSearchApi.analyzeQuery(debouncedQuery),
    enabled: enabled && debouncedQuery.length >= 3,
    staleTime: 10 * 60 * 1000, // 10 phút
    refetchOnWindowFocus: false,
  });
}

// Hook tổng hợp cho việc sử dụng smart search
export function useSmartSearchWithSuggestions() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const smartSearch = useSmartSearch();
  const suggestions = useSearchSuggestions(query, showSuggestions);
  const analysis = useQueryAnalysis(query, query.length >= 3);

  const handleSearch = useCallback(
    async (searchQuery: string, filters?: SmartSearchRequest["filters"]) => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      setQuery(trimmedQuery);
      setShowSuggestions(false);

      return smartSearch.search({
        query: trimmedQuery,
        filters,
      });
    },
    [smartSearch]
  );

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setShowSuggestions(newQuery.length >= 2);
  }, []);

  const hideSuggestions = useCallback(() => {
    setShowSuggestions(false);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setShowSuggestions(false);
      return handleSearch(suggestion);
    },
    [handleSearch]
  );

  return {
    // State
    query,
    showSuggestions,

    // Actions
    handleSearch,
    handleQueryChange,
    hideSuggestions,
    selectSuggestion,

    // Search results
    searchData: smartSearch.data,
    isSearching: smartSearch.isLoading,
    searchError: smartSearch.error,

    // Suggestions
    suggestions: suggestions.data?.suggestions || [],
    isSuggestionsLoading: suggestions.isLoading,

    // Analysis
    analysis: analysis.data,
    isAnalysisLoading: analysis.isLoading,

    // Utils
    resetSearch: smartSearch.reset,
  };
}
