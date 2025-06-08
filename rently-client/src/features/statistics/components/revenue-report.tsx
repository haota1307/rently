import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { RevenueDataPoint } from "../statistics.api";
import { formatCurrency } from "@/lib/utils";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// Mở rộng interface RevenueDataPoint để hỗ trợ trường phí gói dịch vụ
interface ExtendedRevenueDataPoint extends RevenueDataPoint {
  "phí gói dịch vụ"?: number;
}

interface RevenueReportProps {
  data: ExtendedRevenueDataPoint[];
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

  // Kiểm tra loại dữ liệu (nạp/rút hoặc đặt cọc/phí đăng bài/hoàn cọc)
  const hasDepositFeeData = data?.some(
    (item) =>
      item["đặt cọc"] !== undefined ||
      item["phí đăng bài"] !== undefined ||
      item["hoàn cọc"] !== undefined ||
      item["phí gói dịch vụ"] !== undefined
  );

  // Tính tổng thu chi
  const totalIncome = hasDepositFeeData
    ? data?.reduce((sum, item) => sum + (item["đặt cọc"] || 0), 0) || 0
    : data?.reduce((sum, item) => sum + (item.nạp || 0), 0) || 0;

  const totalExpense = hasDepositFeeData
    ? data?.reduce(
        (sum, item) =>
          sum +
          (item["phí đăng bài"] || 0) +
          (item["hoàn cọc"] || 0) +
          (item["phí gói dịch vụ"] || 0),
        0
      ) || 0
    : data?.reduce((sum, item) => sum + (item.rút || 0), 0) || 0;

  // Tính tổng hoàn cọc riêng (để hiển thị trong báo cáo)
  const totalRefund = hasDepositFeeData
    ? data?.reduce((sum, item) => sum + (item["hoàn cọc"] || 0), 0) || 0
    : 0;

  // Tính tổng phí gói dịch vụ riêng
  const totalSubscriptionFee = hasDepositFeeData
    ? data?.reduce((sum, item) => sum + (item["phí gói dịch vụ"] || 0), 0) || 0
    : 0;

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

    // Xác định tên cột dựa vào loại dữ liệu
    const column1Name = hasDepositFeeData ? "Tiền đặt cọc" : "Nạp tiền";
    const column2Name = hasDepositFeeData ? "Phí đăng bài" : "Rút tiền";
    const column3Name = hasDepositFeeData ? "Hoàn tiền cọc" : "";
    const column4Name = hasDepositFeeData ? "Phí gói dịch vụ" : "";
    const summary1Name = hasDepositFeeData
      ? "Tổng tiền đặt cọc:"
      : "Tổng nạp tiền:";
    const summary2Name = hasDepositFeeData
      ? "Tổng phí đăng bài:"
      : "Tổng rút tiền:";
    const summary3Name = "Tổng hoàn tiền cọc:";
    const summary4Name = "Tổng phí gói dịch vụ:";

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
            <span>${summary1Name}</span>
            <span>${formatCurrency(summaryData?.totalIncome || totalIncome)}</span>
          </div>
          <div class="summary-row">
            <span>${summary2Name}</span>
            <span>${formatCurrency(summaryData?.totalExpense || totalExpense)}</span>
          </div>
          <div class="summary-row">
            <span>${summary3Name}</span>
            <span>${formatCurrency(totalRefund)}</span>
          </div>
          <div class="summary-row">
            <span>${summary4Name}</span>
            <span>${formatCurrency(totalSubscriptionFee)}</span>
          </div>
          <div class="summary-row">
            <span>Chênh lệch:</span>
            <span>${formatCurrency(summaryData?.balance || balance)}</span>
          </div>
        </div>

        <h3>Chi tiết doanh thu theo ngày</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 25%">Ngày tháng</th>
              <th style="width: 25%">${column1Name}</th>
              <th style="width: 25%">${column2Name}</th>
              <th style="width: 25%">${column3Name}</th>
              <th style="width: 25%">${column4Name}</th>
            </tr>
          </thead>
          <tbody>
            ${data
              .map(
                (item, index) => `
              <tr key=${index}>
                <td>${format(new Date(item.date), "dd/MM/yyyy", { locale: vi })}</td>
                <td class="amount">${formatCurrency(hasDepositFeeData ? item["đặt cọc"] || 0 : item.nạp || 0)}</td>
                <td class="amount">${formatCurrency(hasDepositFeeData ? item["phí đăng bài"] || 0 : item.rút || 0)}</td>
                <td class="amount">${formatCurrency(hasDepositFeeData ? item["hoàn cọc"] || 0 : 0)}</td>
                <td class="amount">${formatCurrency(hasDepositFeeData ? item["phí gói dịch vụ"] || 0 : 0)}</td>
              </tr>
            `
              )
              .join("")}
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
