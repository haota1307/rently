"use client";

import { useState } from "react";
import { PostType } from "@/schemas/post.schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Brain,
  Target,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Trophy,
  Star,
  TrendingUp,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import http from "@/lib/http";

interface AIComparisonAnalysisProps {
  rooms: PostType[];
}

interface AIAnalysisResponse {
  success: boolean;
  message: string;
  data: {
    analysis: string;
    roomsCount: number;
    timestamp: string;
    rooms: Array<{
      id: number;
      title: string;
      price: number;
      area: number;
      address: string;
      isAvailable: boolean;
      amenitiesCount: number;
    }>;
  };
}

export function AIComparisonAnalysis({ rooms }: AIComparisonAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const analyzeRooms = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Extract room IDs
      const roomIds = rooms.map((room) => room.id);

      // Call AI API
      const response = await http.post<AIAnalysisResponse>(
        "/recommendations/ai-comparison",
        roomIds
      );

      if (response.payload.success) {
        setAnalysis(response.payload.data.analysis);
        setIsExpanded(true);
      } else {
        setError("Không thể phân tích. Vui lòng thử lại.");
      }
    } catch (error) {
      console.error("Error calling AI analysis:", error);
      setError("Có lỗi xảy ra khi phân tích. Vui lòng thử lại sau.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = async () => {
    if (analysis) {
      await navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAnalysisText = (text: string) => {
    // Process text line by line for better markdown parsing
    const lines = text.split("\n");
    const processedLines: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle tables
      if (line.includes("|") && line.split("|").length >= 3) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        tableRows.push(line);
        continue;
      } else if (inTable) {
        // End of table, process it
        if (tableRows.length > 0) {
          const tableHtml = processTable(tableRows);
          processedLines.push(tableHtml);
          tableRows = [];
        }
        inTable = false;
      }

      // Process regular lines
      processedLines.push(processLine(line));
    }

    // Handle any remaining table
    if (inTable && tableRows.length > 0) {
      const tableHtml = processTable(tableRows);
      processedLines.push(tableHtml);
    }

    return processedLines.join("\n");
  };

  const processTable = (rows: string[]): string => {
    if (rows.length < 2) return rows.join("<br/>");

    const headerRow = rows[0];
    const dataRows = rows.slice(2); // Skip separator row

    const headerCells = headerRow
      .split("|")
      .filter((cell) => cell.trim())
      .map((cell) => cell.trim());

    let tableHtml = '<div class="overflow-x-auto my-4">';
    tableHtml +=
      '<table class="w-full border-collapse bg-white rounded-lg shadow-sm border border-emerald-200">';

    // Header
    tableHtml += '<thead class="bg-emerald-50">';
    tableHtml += "<tr>";
    headerCells.forEach((cell) => {
      tableHtml += `<th class="border border-emerald-200 px-3 py-2 text-left font-semibold text-emerald-800 text-sm">${cell}</th>`;
    });
    tableHtml += "</tr>";
    tableHtml += "</thead>";

    // Body
    tableHtml += "<tbody>";
    dataRows.forEach((row, index) => {
      const cells = row
        .split("|")
        .filter((cell) => cell.trim())
        .map((cell) => cell.trim());
      const bgClass = index % 2 === 0 ? "bg-white" : "bg-emerald-25";
      tableHtml += `<tr class="${bgClass}">`;
      cells.forEach((cell) => {
        tableHtml += `<td class="border border-emerald-200 px-3 py-2 text-emerald-700 text-sm">${processInlineFormatting(cell)}</td>`;
      });
      tableHtml += "</tr>";
    });
    tableHtml += "</tbody>";
    tableHtml += "</table>";
    tableHtml += "</div>";

    return tableHtml;
  };

  const processLine = (line: string): string => {
    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith("# ")) {
      return `<h1 class="text-2xl sm:text-3xl font-bold text-emerald-800 mt-8 mb-6 pb-2 border-b-2 border-emerald-200">${trimmed.substring(2)}</h1>`;
    }
    if (trimmed.startsWith("## ")) {
      return `<h2 class="text-xl sm:text-2xl font-bold text-emerald-700 mt-6 mb-4 flex items-center gap-2"><span class="text-emerald-500">▸</span> ${trimmed.substring(3)}</h2>`;
    }
    if (trimmed.startsWith("### ")) {
      return `<h3 class="text-lg sm:text-xl font-semibold text-emerald-600 mt-5 mb-3 flex items-center gap-2"><span class="w-2 h-2 bg-emerald-400 rounded-full"></span> ${trimmed.substring(4)}</h3>`;
    }

    // Lists
    if (trimmed.startsWith("- **")) {
      const content = trimmed.substring(4);
      return `<div class="ml-4 mb-3"><div class="flex items-start gap-3"><span class="flex-shrink-0 w-2 h-2 bg-emerald-400 rounded-full mt-2"></span><div class="flex-1">${processInlineFormatting(content)}</div></div></div>`;
    }
    if (trimmed.startsWith("  - ")) {
      return `<div class="ml-8 mb-2 flex items-start gap-2"><span class="flex-shrink-0 w-1.5 h-1.5 bg-emerald-300 rounded-full mt-2"></span><span class="flex-1 text-emerald-600">${processInlineFormatting(trimmed.substring(4))}</span></div>`;
    }
    if (trimmed.startsWith("- ")) {
      return `<div class="ml-4 mb-2 flex items-start gap-2"><span class="flex-shrink-0 w-2 h-2 bg-emerald-400 rounded-full mt-2"></span><span class="flex-1 text-emerald-700">${processInlineFormatting(trimmed.substring(2))}</span></div>`;
    }

    // Empty lines
    if (trimmed === "") {
      return '<div class="my-3"></div>';
    }

    // Regular paragraphs
    return `<p class="mb-3 text-emerald-700 leading-relaxed">${processInlineFormatting(trimmed)}</p>`;
  };

  const processInlineFormatting = (text: string): string => {
    return (
      text
        // Bold text
        .replace(
          /\*\*(.*?)\*\*/g,
          '<strong class="font-bold text-emerald-800">$1</strong>'
        )
        // Italic text
        .replace(/\*(.*?)\*/g, '<em class="italic text-emerald-700">$1</em>')
        // Vietnamese prices
        .replace(
          /(\d+\.\d+\.?\d*\s*VNĐ)/g,
          '<span class="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded text-xs">$1</span>'
        )
        // Area
        .replace(
          /(\d+\s*m²)/g,
          '<span class="font-semibold text-green-600 bg-green-50 px-2 py-1 rounded text-xs">$1</span>'
        )
        // Scores
        .replace(
          /(\d+\/\d+)/g,
          '<span class="font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded text-xs">$1</span>'
        )
        // Emojis
        .replace(
          /(🏆|📍|💰|📏|🎯|😊|⭐|🔥|👍|⚡|✨|🏠|🌟)/g,
          '<span class="inline-block mr-1">$1</span>'
        )
    );
  };

  if (analysis) {
    return (
      <div className="w-full space-y-6 animate-in fade-in duration-700">
        {/* Success Header - Mobile Optimized */}
        <div className="text-center py-3 px-4">
          <div className="inline-flex flex-col sm:flex-row items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium animate-in zoom-in duration-500 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">Phân tích AI hoàn tất!</span>
            </div>
            <span className="text-xs opacity-75">
              {rooms.length} phòng đã được phân tích
            </span>
          </div>
        </div>

        {/* AI Analysis Results - Responsive */}
        <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
          {/* AI decoration - Hidden on mobile for better space */}
          <div className="hidden sm:block absolute top-0 right-0 w-0 h-0 border-l-[50px] sm:border-l-[60px] border-l-transparent border-t-[50px] sm:border-t-[60px] border-t-emerald-500"></div>
          <Brain className="hidden sm:block absolute top-2 right-2 h-5 w-5 sm:h-6 sm:w-6 text-white" />

          <CardHeader className="relative pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-3 text-emerald-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Brain className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent">
                    🤖 Phân tích AI thông minh
                  </div>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 border-emerald-300 ml-auto sm:ml-0"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                AI Report
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* Analysis Content with better formatting */}
            <div
              className={cn(
                "transition-all duration-500 ease-in-out overflow-hidden",
                isExpanded ? "max-h-none" : "max-h-48 sm:max-h-64"
              )}
            >
              <div className="prose prose-sm sm:prose-base max-w-none">
                <div
                  className="text-gray-800 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{
                    __html: formatAnalysisText(analysis),
                  }}
                />
              </div>
            </div>

            {/* Expand/Collapse Button */}
            {analysis.length > 500 && (
              <div className="text-center">
                <Button
                  onClick={() => setIsExpanded(!isExpanded)}
                  variant="ghost"
                  size="sm"
                  className="text-emerald-700 hover:bg-emerald-100"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Thu gọn
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Xem đầy đủ
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Action buttons - Responsive */}
            <div className="pt-4 border-t border-emerald-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => setAnalysis(null)}
                  variant="outline"
                  className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Phân tích lại
                </Button>
                <Button
                  onClick={copyToClipboard}
                  variant="secondary"
                  className="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? "Đã sao chép!" : "Sao chép báo cáo"}
                </Button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-amber-700 text-center leading-relaxed">
                <span className="font-medium">⚠️ Lưu ý:</span> Kết quả phân tích
                AI chỉ mang tính chất tham khảo và có thể khác nhau giữa các lần
                phân tích. Vui lòng xem xét thêm các yếu tố thực tế khác khi đưa
                ra quyết định thuê phòng cuối cùng.
              </p>
            </div>

            {/* Quick Stats - Mobile friendly */}
            <div className="bg-white/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-medium">
                <TrendingUp className="h-4 w-4" />
                <span>Thống kê nhanh</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-emerald-600">
                    {rooms.length}
                  </div>
                  <div className="text-xs text-emerald-600">Phòng so sánh</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(analysis.length / 100)}
                  </div>
                  <div className="text-xs text-emerald-600">Điểm AI</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-emerald-600">4</div>
                  <div className="text-xs text-emerald-600">Tiêu chí</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-emerald-600">
                    <Trophy className="h-6 w-6 mx-auto text-yellow-500" />
                  </div>
                  <div className="text-xs text-emerald-600">Gợi ý hàng đầu</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card className="border-2 border-dashed border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 overflow-hidden relative">
        {/* Background decoration - Responsive */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-4 w-16 h-16 sm:w-20 sm:h-20 bg-violet-200 rounded-full blur-xl"></div>
          <div className="absolute bottom-4 right-4 w-12 h-12 sm:w-16 sm:h-16 bg-purple-200 rounded-full blur-lg"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 bg-indigo-200 rounded-full blur-2xl"></div>
        </div>

        <CardHeader className="text-center relative z-10 pb-4 px-4 sm:px-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-center gap-3 text-xl sm:text-2xl">
            <div className="relative mx-auto sm:mx-0">
              <div className="p-3 bg-violet-100 rounded-xl">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-violet-600" />
              </div>
              {!isAnalyzing && (
                <Sparkles className="h-4 w-4 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
              )}
            </div>
            <div className="text-center sm:text-left">
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-bold">
                Phân tích AI thông minh
              </div>
            </div>
          </CardTitle>

          <CardDescription className="text-violet-700 text-base sm:text-lg mt-3 max-w-2xl mx-auto leading-relaxed">
            Sử dụng trí tuệ nhân tạo để phân tích và đưa ra gợi ý phòng trọ tốt
            nhất dành cho bạn
          </CardDescription>

          <div className="mt-4 p-3 bg-violet-50 border border-violet-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-xs text-violet-600 text-center leading-relaxed">
              <span className="font-medium">Lưu ý:</span> Phân tích chỉ mang
              tính chất tham khảo và có thể khác nhau giữa các lần phân tích.
              Vui lòng xem xét thêm các yếu tố khác khi đưa ra quyết định cuối
              cùng.
            </p>
          </div>

          {isAnalyzing && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-center gap-2 text-violet-600">
                <Zap className="h-4 w-4 animate-pulse" />
                <span className="font-medium text-sm sm:text-base">
                  AI đang phân tích dữ liệu...
                </span>
              </div>
              <div className="w-full max-w-sm mx-auto space-y-2">
                <Progress value={75} className="h-2" />
                <div className="text-xs text-violet-600 text-center">
                  Đang xử lý {rooms.length} phòng trọ
                </div>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="text-center relative z-10 pt-0 px-4 sm:px-6 pb-6">
          <div className="space-y-4">
            <Button
              onClick={analyzeRooms}
              disabled={isAnalyzing || rooms.length < 2}
              size="lg"
              className={cn(
                "w-full sm:w-auto bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700",
                "shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200",
                "text-white font-semibold px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg",
                "min-h-[48px] sm:min-h-[56px]"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="mr-3 h-5 w-5 animate-spin" />
                  Đang phân tích...
                </>
              ) : (
                <>
                  <Target className="mr-3 h-5 w-5" />
                  Bắt đầu phân tích AI
                </>
              )}
            </Button>

            {/* Room count indicator */}
            {rooms.length >= 2 && (
              <div className="text-sm text-violet-600 bg-violet-100 rounded-lg p-3 max-w-sm mx-auto">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sẵn sàng phân tích {rooms.length} phòng trọ</span>
                </div>
              </div>
            )}

            {rooms.length < 2 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl max-w-sm mx-auto">
                <p className="text-sm text-amber-700 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Cần ít nhất 2 phòng để phân tích
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl max-w-md mx-auto">
                <p className="text-sm text-red-700 flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
                <Button
                  onClick={() => setError(null)}
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-red-600 hover:bg-red-100"
                >
                  Đóng
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
