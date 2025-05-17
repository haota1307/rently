import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RevenueDataPoint } from "./statistics.api";
import { formatCurrency } from "@/lib/utils";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface RevenueReportProps {
  data: RevenueDataPoint[];
  timeRange: number;
  dateFilter: {
    from: Date | undefined;
    to: Date | undefined;
  };
  summaryData?: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

const RevenueReport: React.FC<RevenueReportProps> = ({
  data,
  timeRange,
  dateFilter,
  summaryData,
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  // Tính tổng thu chi
  const totalIncome =
    data?.reduce((sum, item) => sum + (item.nạp || 0), 0) || 0;
  const totalExpense =
    data?.reduce((sum, item) => sum + (item.rút || 0), 0) || 0;
  const balance = totalIncome - totalExpense;

  // Xử lý xuất báo cáo
  const handlePrintReport = () => {
    // Tạo một cửa sổ mới để in báo cáo
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
      alert("Vui lòng cho phép hiển thị cửa sổ popup để xuất báo cáo.");
      return;
    }

    // Tạo tiêu đề báo cáo dựa trên khoảng thời gian
    let reportTitle = `Báo cáo doanh thu ${timeRange} ngày gần đây`;
    if (dateFilter.from && dateFilter.to) {
      reportTitle = `Báo cáo doanh thu từ ${format(dateFilter.from, "dd/MM/yyyy", { locale: vi })} đến ${format(dateFilter.to, "dd/MM/yyyy", { locale: vi })}`;
    }

    // Tạo nội dung HTML cho cửa sổ in
    const reportContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.5;
          }
          .report-header {
            text-align: center;
            margin-bottom: 30px;
          }
          .report-title {
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .report-date {
            font-size: 14px;
            color: #555;
            margin-bottom: 20px;
          }
          .report-summary {
            margin-bottom: 30px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .summary-row:last-child {
            border-bottom: none;
            font-weight: bold;
          }
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .report-table th, .report-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
          }
          .report-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }
          .report-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          .amount {
            text-align: right;
            font-family: monospace, sans-serif;
          }
          .signature-area {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            text-align: center;
            width: 200px;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
          }
          @media print {
            body {
              margin: 0;
              padding: 20px;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="report-title">${reportTitle}</div>
          <div class="report-date">Ngày xuất báo cáo: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: vi })}</div>
        </div>

        <div class="report-summary">
          <h3>Tổng kết doanh thu</h3>
          <div class="summary-row">
            <span>Tổng nạp tiền:</span>
            <span>${formatCurrency(summaryData?.totalIncome || totalIncome)}</span>
          </div>
          <div class="summary-row">
            <span>Tổng rút tiền:</span>
            <span>${formatCurrency(summaryData?.totalExpense || totalExpense)}</span>
          </div>
          <div class="summary-row">
            <span>Chênh lệch:</span>
            <span>${formatCurrency(summaryData?.balance || balance)}</span>
          </div>
        </div>

        <h3>Chi tiết doanh thu theo ngày</h3>
                  <table class="report-table">          <thead>            <tr>              <th style="width: 40%">Ngày tháng</th>              <th style="width: 30%">Nạp tiền</th>              <th style="width: 30%">Rút tiền</th>            </tr>          </thead>          <tbody>            ${data.map((item, index) => `              <tr key=${index}>                <td>${format(new Date(item.date), "dd/MM/yyyy", { locale: vi })}</td>                <td class="amount">${formatCurrency(item.nạp || 0)}</td>                <td class="amount">${formatCurrency(item.rút || 0)}</td>              </tr>            `).join("")}
          </tbody>
        </table>

        <div class="signature-area">
          <div class="signature-box">
            <p>Người lập báo cáo</p>
            <div class="signature-line"></div>
          </div>

          <div class="signature-box">
            <p>Xác nhận của quản lý</p>
            <div class="signature-line"></div>
          </div>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()">In báo cáo</button>
          <button onclick="window.close()">Đóng</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(reportContent);
    printWindow.document.close();

    printWindow.onload = function () {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 100);
    };
  };

  return (
    <Button
      onClick={handlePrintReport}
      className="h-7 md:h-8 text-[10px] md:text-xs px-2 md:px-3 flex items-center gap-1"
      variant="outline"
    >
      <FileDown className="h-3 w-3 md:h-4 md:w-4" />
      Xuất báo cáo
    </Button>
  );
};

export default RevenueReport;
