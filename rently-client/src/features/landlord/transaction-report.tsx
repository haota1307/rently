import React from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { FileDown } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  amount: number;
  isDeposit: boolean;
  transactionDate: Date;
  description: string;
  status: string;
}

interface TransactionReportProps {
  transactions: Transaction[];
  title?: string;
  summaryData?: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
}

const getTransactionType = (transaction: Transaction) => {
  const content = transaction.description.toLowerCase();

  if (transaction.isDeposit) {
    if (
      content.includes("từ người thuê") ||
      content.includes("thanh toán") ||
      content.includes("nhận tiền đặt")
    ) {
      return "Thu từ người thuê";
    } else {
      return "Nạp tiền vào tài khoản";
    }
  } else {
    if (
      content.includes("phí đăng") ||
      content.includes("phí quảng cáo") ||
      content.includes("phí dịch vụ")
    ) {
      return "Phí đăng bài";
    } else if (content.includes("rút tiền")) {
      return "Rút tiền về tài khoản";
    } else {
      return "Chi phí dịch vụ";
    }
  }
};

const getStatusDisplay = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "Hoàn thành";
    case "PENDING":
      return "Đang chờ xử lý";
    case "CANCELED":
      return "Đã hủy";
    case "REJECTED":
      return "Bị từ chối";
    default:
      return "Không xác định";
  }
};

const TransactionReport: React.FC<TransactionReportProps> = ({
  transactions,
  title = "Báo cáo giao dịch",
  summaryData,
}) => {
  // Tính tổng thu chi
  const totalIncome =
    summaryData?.totalIncome ||
    transactions.reduce(
      (sum, txn) => sum + (txn.isDeposit ? txn.amount : 0),
      0
    );
  const totalExpense =
    summaryData?.totalExpense ||
    transactions.reduce(
      (sum, txn) => sum + (!txn.isDeposit ? txn.amount : 0),
      0
    );
  const balance = summaryData?.balance || totalIncome - totalExpense;

  // Xử lý xuất báo cáo
  const handlePrintReport = () => {
    // Tạo một cửa sổ mới để in báo cáo
    const printWindow = window.open("", "_blank", "width=800,height=600");

    if (!printWindow) {
      alert("Vui lòng cho phép hiển thị cửa sổ popup để xuất báo cáo.");
      return;
    }

    const reportTitle = title;

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
          .income {
            color: #10b981;
          }
          .expense {
            color: #ef4444;
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
          <h3>Tổng kết tài chính</h3>
          <div class="summary-row">
            <span>Tổng thu:</span>
            <span>${formatCurrency(totalIncome)}</span>
          </div>
          <div class="summary-row">
            <span>Tổng chi:</span>
            <span>${formatCurrency(totalExpense)}</span>
          </div>
          <div class="summary-row">
            <span>Chênh lệch:</span>
            <span>${formatCurrency(balance)}</span>
          </div>
        </div>

        <h3>Chi tiết giao dịch</h3>
        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 20%">Ngày tháng</th>
              <th style="width: 20%">Loại giao dịch</th>
              <th style="width: 30%">Mô tả</th>
              <th style="width: 15%">Số tiền</th>
              <th style="width: 15%">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${transactions
              .map(
                (transaction, index) => `
              <tr key=${index}>
                <td>${format(new Date(transaction.transactionDate), "dd/MM/yyyy", { locale: vi })}</td>
                <td>${getTransactionType(transaction)}</td>
                <td>${transaction.description}</td>
                <td class="amount ${transaction.isDeposit ? "income" : "expense"}">
                  ${transaction.isDeposit ? "+" : "-"}${formatCurrency(transaction.amount)}
                </td>
                <td>${getStatusDisplay(transaction.status)}</td>
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
      }, 1000);
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

export default TransactionReport;
