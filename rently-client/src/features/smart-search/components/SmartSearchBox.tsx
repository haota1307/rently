"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Sparkles, ArrowRight, MapPin, Filter } from "lucide-react";
import { cn, createPostSlug } from "@/lib/utils";
import { useSmartSearchWithSuggestions } from "../useSmartSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface SmartSearchBoxProps {
  onSearchResults?: (results: any) => void;
  placeholder?: string;
  className?: string;
  variant?: "hero" | "compact";
}

export function SmartSearchBox({
  onSearchResults,
  placeholder = "Tìm phòng trọ cho sinh viên, có cho nuôi thú cưng, có máy lạnh, có wifi...",
  className,
  variant = "hero",
}: SmartSearchBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  const {
    query,
    showSuggestions,
    handleSearch,
    handleQueryChange,
    hideSuggestions,
    selectSuggestion,
    searchData,
    isSearching,
    suggestions,
    isSuggestionsLoading,
    analysis,
  } = useSmartSearchWithSuggestions();

  // Handle search results
  useEffect(() => {
    if (searchData && onSearchResults) {
      onSearchResults(searchData);
    }
  }, [searchData, onSearchResults]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        hideSuggestions();
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [hideSuggestions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const isHeroVariant = variant === "hero";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative flex items-center group transition-all duration-200",
            isFocused || query ? "ring-2 ring-blue-500/20" : "",
            isHeroVariant
              ? "bg-white rounded-2xl shadow-xl border border-gray-200 h-12 md:h-16"
              : "bg-white rounded-lg shadow-md border border-gray-200 h-12",
          )}
        >
          {/* Icon tìm kiếm */}
          <div
            className={cn(
              "flex items-center justify-center text-gray-400",
              isHeroVariant ? "pl-4 md:pl-6 pr-3 md:pr-4" : "pl-4 pr-3",
            )}
          >
            <Search
              className={cn(
                "transition-colors",
                isFocused && "text-blue-500",
                isHeroVariant ? "h-6 w-6" : "h-5 w-5",
              )}
            />
          </div>

          {/* Input */}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={handleFocus}
            placeholder={placeholder}
            className={cn(
              "flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
              isHeroVariant
                ? "text-base md:text-lg placeholder:text-gray-400 h-full"
                : "text-base placeholder:text-gray-400 h-full",
            )}
          />

          {/* AI Badge */}
          {query && analysis && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs rounded-full font-medium",
                isHeroVariant ? "mx-2 md:mx-3" : "mx-2",
              )}
            >
              <Sparkles className="h-3 w-3" />
              <span>AI</span>
            </motion.div>
          )}

          {/* Nút tìm kiếm */}
          <Button
            type="submit"
            disabled={!query.trim() || isSearching}
            className={cn(
              "rounded-xl font-medium transition-all",
              isHeroVariant
                ? "h-10 md:h-12 px-4 md:px-8 text-sm md:text-base mr-1 md:mr-2"
                : "h-8 px-4 text-sm mr-1",
            )}
          >
            {isSearching ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                Tìm kiếm
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Analysis Summary */}
      <AnimatePresence>
        {query && analysis && analysis.summary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "mt-2 text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100",
              isHeroVariant
                ? "text-sm md:text-base px-4 md:px-6 py-2 md:py-3"
                : "",
            )}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span>{analysis.summary}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            <div className="p-3">
              <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                Gợi ý
              </div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`suggestion-${index}-${suggestion.slice(0, 10)}`}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading suggestions */}
      {isSuggestionsLoading && showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            Đang tải gợi ý...
          </div>
        </div>
      )}
    </div>
  );
}

// Component hiển thị kết quả tìm kiếm
interface SearchResultsProps {
  results: any;
  className?: string;
}

export function SearchResults({ results, className }: SearchResultsProps) {
  if (!results) return null;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Kết quả tìm kiếm</h2>
          <Badge variant="secondary" className="text-sm">
            {results.totalFound} kết quả
          </Badge>
        </div>

        {results.summary && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-blue-700">{results.summary}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid kết quả */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.results?.map((room: any) => {
          // Tạo slug cho bài đăng - sử dụng postId thay vì room.id
          const postSlug = createPostSlug(room.title, room.postId);

          return (
            <Link
              key={room.postId}
              href={`/bai-dang/${postSlug}`}
              className="group"
            >
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.02] cursor-pointer">
                {room.images?.[0] && (
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    <img
                      src={room.images[0]}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {room.isRecommended && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-blue-500">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Phù hợp
                      </Badge>
                    )}
                  </div>
                )}

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {room.title}
                  </h3>

                  <div className="flex items-center gap-1 text-gray-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm line-clamp-1">{room.address}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat("vi-VN").format(room.price)}₫/tháng
                    </span>
                    <span className="text-sm text-gray-500">{room.area}m²</span>
                  </div>

                  {room.amenities?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {room.amenities
                        .slice(0, 3)
                        .map((amenity: string, index: number) => (
                          <Badge
                            key={`${room.postId}-amenity-${index}-${amenity}`}
                            variant="outline"
                            className="text-xs"
                          >
                            {amenity}
                          </Badge>
                        ))}
                      {room.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.amenities.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <Button
                      size="sm"
                      className="w-full text-xs group-hover:bg-blue-600 transition-colors"
                    >
                      Xem chi tiết
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
