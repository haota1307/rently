"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownToLine,
  BanknoteIcon,
  CheckCircle,
  XCircle,
  QrCode,
  CopyIcon,
  ExternalLink,
  Download,
  AlertCircleIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import paymentApiRequest from "@/features/payment/payment.api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAppStore, useSocketEvent } from "@/components/app-provider";

interface WithdrawRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  status: string;
  description: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  createdAt: string;
  updatedAt: string;
}

interface QRCodeData {
  qrCodeUrl: string;
  withdrawId: number;
  amount: number;
  transferContent: string;
  recipientInfo: {
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
  };
}

interface ResponsePayload {
  status: number;
  error: null;
  messages: { success: boolean };
  qrCodeData: QRCodeData;
}

const VIET_QR_API = "https://img.vietqr.io/image";

const WithdrawManagementPage = () => {
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRequest, setSelectedRequest] =
    useState<WithdrawRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [vietQrUrl, setVietQrUrl] = useState<string | null>(null);
  const [showVietQr, setShowVietQr] = useState(false);
  const [openQrDialog, setOpenQrDialog] = useState(false);
  const qrImageRef = useRef<HTMLImageElement>(null);

  // Lấy socket từ store
  const socket = useAppStore((state) => state.socket);
  const emitSocketEvent = useAppStore((state) => state.emitSocketEvent);

  // Sử dụng một ref để theo dõi các sự kiện đã xử lý để tránh trùng lặp
  const processedEvents = useRef<Set<string>>(new Set());

  // Tải danh sách yêu cầu rút tiền
  const fetchWithdrawRequests = useCallback(async (status?: string) => {
    try {
      setLoading(true);
      const response = await paymentApiRequest.getTransactions({
        ...(status && status !== "all" && { status }),
      });

      if (response.payload?.transactions) {
        // Lọc các giao dịch là yêu cầu rút tiền
        const withdrawRequests = response.payload.transactions
          .filter(
            (transaction: any) =>
              parseFloat(transaction.amount_out) > 0 &&
              transaction.transaction_content?.includes("Yêu cầu rút tiền")
          )
          .map((transaction: any) => {
            const createdAt = new Date(transaction.transaction_date);

            // Trích xuất thông tin ngân hàng từ nội dung giao dịch
            const contentParts = transaction.transaction_content?.split(" - ");
            const bankName = contentParts?.length > 1 ? contentParts[1] : "";
            const accountMatch =
              transaction.transaction_content?.match(/tài khoản (\d+)/);
            const bankAccountNumber = accountMatch ? accountMatch[1] : "";

            // Lấy tên chủ tài khoản từ metadata của transaction
            let bankAccountName = "";

            // Kiểm tra và lấy tên chủ tài khoản từ metadata
            try {
              if (
                transaction.metadata &&
                transaction.metadata.bankAccountName
              ) {
                // Ưu tiên lấy từ metadata của transaction
                bankAccountName = transaction.metadata.bankAccountName;
              } else if (
                transaction.payment_metadata &&
                transaction.payment_metadata.bankAccountName
              ) {
                // Nếu không có trong metadata transaction, lấy từ payment_metadata
                bankAccountName = transaction.payment_metadata.bankAccountName;
              } else if (
                transaction.withdraw_request &&
                transaction.withdraw_request.bankAccountName
              ) {
                // Nếu có thông tin yêu cầu rút tiền, lấy từ đó
                bankAccountName = transaction.withdraw_request.bankAccountName;
              } else {
                // Fallback dùng tên người dùng
                bankAccountName = transaction.user?.name || "Không rõ";
              }
            } catch (e) {
              bankAccountName = transaction.user?.name || "Không rõ";
            }

            return {
              id: parseInt(transaction.id),
              userId: transaction.user?.id ? parseInt(transaction.user.id) : 0,
              userName: transaction.user?.name || "Không rõ",
              userEmail: transaction.user?.email || "",
              amount: parseFloat(transaction.amount_out),
              status: transaction.status,
              description: transaction.transaction_content || "",
              bankName: bankName,
              bankAccountNumber: bankAccountNumber,
              bankAccountName: bankAccountName, // Tên chủ tài khoản
              createdAt: format(createdAt, "dd/MM/yyyy HH:mm:ss"),
              updatedAt: transaction.transaction_date,
            };
          });

        setWithdrawRequests(withdrawRequests);
      }
    } catch (err) {
      setError("Không thể tải danh sách yêu cầu rút tiền");
    } finally {
      setLoading(false);
    }
  }, []);

  // Tìm và cập nhật thông tin của một yêu cầu rút tiền cụ thể
  const fetchAndUpdateSingleWithdraw = useCallback(
    async (withdrawId: number) => {
      try {
        const response = await paymentApiRequest.getTransactions({
          id: withdrawId,
        });

        if (
          response.status === 200 &&
          response.payload?.transactions?.length > 0
        ) {
          const transactionData = response.payload.transactions[0];

          // Đóng dialog nếu đang hiển thị request được xác nhận và trạng thái là COMPLETED
          if (transactionData.status === "COMPLETED") {
            if (selectedRequest && selectedRequest.id === withdrawId) {
              setOpenQrDialog(false);
              setQrCodeUrl(null);
              setVietQrUrl(null);
              setSelectedRequest(null);

              // Hiển thị thông báo thành công
              toast.success(`Yêu cầu rút tiền #${withdrawId} đã được xác nhận`);
            }
          }

          // Cập nhật giao dịch trong danh sách nếu nó đã tồn tại
          setWithdrawRequests((prevRequests) => {
            const index = prevRequests.findIndex(
              (req) => req.id === withdrawId
            );

            if (index >= 0) {
              // Giao dịch đã tồn tại, cập nhật nó
              const updatedRequests = [...prevRequests];
              updatedRequests[index] = {
                ...updatedRequests[index],
                status: transactionData.status,
                updatedAt: transactionData.transaction_date,
              };
              return updatedRequests;
            } else {
              // Giao dịch chưa có trong danh sách, thêm mới nếu phù hợp
              if (
                parseFloat(transactionData.amount_out) > 0 &&
                transactionData.transaction_content?.includes(
                  "Yêu cầu rút tiền"
                )
              ) {
                // Tạo yêu cầu rút tiền mới từ giao dịch này
                const createdAt = new Date(transactionData.transaction_date);
                const contentParts =
                  transactionData.transaction_content?.split(" - ");
                const bankName =
                  contentParts?.length > 1 ? contentParts[1] : "";
                const accountMatch =
                  transactionData.transaction_content?.match(/tài khoản (\d+)/);
                const bankAccountNumber = accountMatch ? accountMatch[1] : "";

                let bankAccountName = "";
                try {
                  if (
                    transactionData.metadata &&
                    transactionData.metadata.bankAccountName
                  ) {
                    bankAccountName = transactionData.metadata.bankAccountName;
                  } else if (
                    transactionData.payment_metadata &&
                    transactionData.payment_metadata.bankAccountName
                  ) {
                    bankAccountName =
                      transactionData.payment_metadata.bankAccountName;
                  } else if (
                    transactionData.withdraw_request &&
                    transactionData.withdraw_request.bankAccountName
                  ) {
                    bankAccountName =
                      transactionData.withdraw_request.bankAccountName;
                  } else {
                    bankAccountName = transactionData.user?.name || "Không rõ";
                  }
                } catch (e) {
                  bankAccountName = transactionData.user?.name || "Không rõ";
                }

                const newRequest: WithdrawRequest = {
                  id: parseInt(transactionData.id),
                  userId: transactionData.user?.id
                    ? parseInt(transactionData.user.id)
                    : 0,
                  userName: transactionData.user?.name || "Không rõ",
                  userEmail: transactionData.user?.email || "",
                  amount: parseFloat(transactionData.amount_out),
                  status: transactionData.status,
                  description: transactionData.transaction_content || "",
                  bankName: bankName,
                  bankAccountNumber: bankAccountNumber,
                  bankAccountName: bankAccountName,
                  createdAt: format(createdAt, "dd/MM/yyyy HH:mm:ss"),
                  updatedAt: transactionData.transaction_date,
                };

                return [...prevRequests, newRequest];
              }
              return prevRequests;
            }
          });

          return true;
        } else {
          // Nếu không tìm thấy giao dịch cụ thể, làm mới toàn bộ danh sách
          fetchWithdrawRequests(statusFilter);
          return false;
        }
      } catch (error) {
        // Trong trường hợp lỗi, vẫn làm mới danh sách
        fetchWithdrawRequests(statusFilter);
        return false;
      }
    },
    [selectedRequest, statusFilter, fetchWithdrawRequests]
  );

  // Hàm chung để đóng modal và cập nhật danh sách khi có sự kiện từ server
  const closeModalAndUpdateList = useCallback(
    (withdrawId: number, status: string, amount?: number) => {
      // Nếu đang hiển thị modal QR cho yêu cầu vừa được cập nhật
      if (selectedRequest && selectedRequest.id === withdrawId) {
        // Đóng modal và reset state
        setOpenQrDialog(false);
        setQrCodeUrl(null);
        setVietQrUrl(null);
        setSelectedRequest(null);
        setProcessingId(null);

        // Hiển thị thông báo
        if (status === "COMPLETED") {
          toast.success(
            `Yêu cầu rút tiền #${withdrawId} đã được xác nhận thành công`
          );
        } else if (status === "REJECTED") {
          toast.error(`Yêu cầu rút tiền #${withdrawId} đã bị từ chối`);
        } else {
          toast.info(
            `Trạng thái yêu cầu rút tiền #${withdrawId} đã được cập nhật thành ${status}`
          );
        }
      }

      // Cập nhật trạng thái trong danh sách
      setWithdrawRequests((prevRequests) =>
        prevRequests.map((req) => {
          if (req.id === withdrawId) {
            return {
              ...req,
              status,
              updatedAt: new Date().toISOString(),
              amount: amount !== undefined ? amount : req.amount,
            };
          }
          return req;
        })
      );

      // Gọi API để cập nhật đầy đủ thông tin từ server
      fetchAndUpdateSingleWithdraw(withdrawId);
    },
    [selectedRequest, fetchAndUpdateSingleWithdraw]
  );

  // Xử lý dữ liệu từ sự kiện payment status updated
  const processPaymentUpdateData = useCallback(
    (updateData: any) => {
      let withdrawId = null;

      // Trích xuất ID từ dữ liệu
      if (updateData.id) {
        withdrawId = updateData.id;
      } else if (
        updateData.description &&
        typeof updateData.description === "string" &&
        updateData.description.includes("#RUT")
      ) {
        const match = updateData.description.match(/#RUT(\d+)/);
        if (match && match[1]) {
          withdrawId = parseInt(match[1], 10);
        }
      }

      if (withdrawId) {
        const status = updateData.status || "COMPLETED";
        closeModalAndUpdateList(withdrawId, status, updateData.amount);
      } else {
        // Không có ID cụ thể, cập nhật toàn bộ danh sách
        fetchWithdrawRequests(statusFilter);
      }
    },
    [statusFilter, fetchWithdrawRequests, closeModalAndUpdateList]
  );

  // Xử lý sự kiện payment status updated
  const handlePaymentStatusUpdate = useCallback(
    (data: any) => {
      try {
        // Xử lý dữ liệu
        if (data && data.id) {
          // Tạo ID duy nhất cho sự kiện
          const eventId = `payment-${data.id}-${
            data.timestamp || new Date().toISOString()
          }`;

          // Kiểm tra xem sự kiện này đã được xử lý chưa
          if (processedEvents.current.has(eventId)) {
            return;
          }

          // Đánh dấu sự kiện này đã được xử lý
          processedEvents.current.add(eventId);

          // Xử lý cập nhật
          processPaymentUpdateData(data);

          // Xóa sự kiện này sau 30 giây để tránh tràn bộ nhớ
          setTimeout(() => {
            processedEvents.current.delete(eventId);
          }, 30000);
        }
      } catch (err) {
        console.error("Lỗi xử lý sự kiện paymentStatusUpdated:", err);
      }
    },
    [processPaymentUpdateData]
  );

  // Xử lý sự kiện withdraw-confirm
  const handleWithdrawConfirm = useCallback(
    (data: any) => {
      if (data && data.withdrawId && data.timestamp) {
        // Tạo một ID duy nhất cho sự kiện này
        const eventId = `withdraw-${data.withdrawId}-${data.timestamp}`;

        // Kiểm tra xem sự kiện này đã được xử lý chưa
        if (processedEvents.current.has(eventId)) {
          return;
        }

        // Đánh dấu sự kiện này đã được xử lý
        processedEvents.current.add(eventId);

        closeModalAndUpdateList(
          parseInt(data.withdrawId),
          data.status || "COMPLETED",
          data.amount
        );

        // Xóa các sự kiện cũ sau 30 giây để tránh tràn bộ nhớ
        setTimeout(() => {
          processedEvents.current.delete(eventId);
        }, 30000);
      }
    },
    [closeModalAndUpdateList]
  );

  // ===== SOCKET CONNECTION & LIFECYCLE =====
  // Tải danh sách yêu cầu rút tiền khi component mount
  useEffect(() => {
    fetchWithdrawRequests(statusFilter);

    // Đảm bảo làm mới danh sách định kỳ để không bỏ lỡ cập nhật
    const refreshInterval = setInterval(() => {
      fetchWithdrawRequests(statusFilter);
    }, 60000); // Mỗi phút

    return () => {
      clearInterval(refreshInterval);
    };
  }, [statusFilter, fetchWithdrawRequests]);

  // Xử lý sự kiện kết nối socket
  useEffect(() => {
    if (!socket) return;

    // Nếu socket chưa kết nối, thử kết nối
    if (!socket.connected) {
      socket.connect();
    }

    // Tham gia room admin sau khi kết nối
    const joinAdminRoom = () => {
      if (socket.connected) {
        emitSocketEvent("join-admin-room", { role: "admin" });
        socket.emit("join", "admin-room");
      }
    };

    // Join ngay khi đã kết nối
    joinAdminRoom();

    // Lắng nghe sự kiện kết nối thành công để join room
    const handleConnect = () => {
      joinAdminRoom();
    };

    socket.on("connect", handleConnect);

    // Ping server để giữ kết nối
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        emitSocketEvent("ping", { timestamp: new Date().toISOString() });
      } else {
        socket.connect();
      }
    }, 15000); // Rút ngắn thời gian ping xuống 15 giây

    return () => {
      clearInterval(pingInterval);
      socket.off("connect", handleConnect);
    };
  }, [socket, emitSocketEvent]);

  // Lắng nghe phản hồi từ sự kiện tham gia admin room
  useEffect(() => {
    if (!socket) return;

    const handleJoinAdminRoomResponse = (data: any) => {
      if (!data.success && socket && socket.connected) {
        // Thử tham gia lại sau 5 giây nếu không thành công
        setTimeout(() => {
          emitSocketEvent("join-admin-room", { role: "admin" });
        }, 5000);
      }
    };

    socket.on("joinAdminRoomResponse", handleJoinAdminRoomResponse);

    return () => {
      socket.off("joinAdminRoomResponse", handleJoinAdminRoomResponse);
    };
  }, [socket, emitSocketEvent]);

  // Đăng ký lắng nghe các sự kiện
  useSocketEvent("withdraw-confirm", handleWithdrawConfirm, [selectedRequest]);
  // Không lắng nghe transaction-updated nữa để tránh xử lý trùng lặp
  useSocketEvent("paymentStatusUpdated", handlePaymentStatusUpdate, [
    processPaymentUpdateData,
  ]);

  // Load chi tiết yêu cầu rút tiền để lấy thông tin chính xác
  const loadWithdrawDetail = async (request: WithdrawRequest) => {
    try {
      const response = await paymentApiRequest.getTransactions({
        id: request.id,
      });

      if (
        response.status === 200 &&
        response.payload?.transactions?.length > 0
      ) {
        const transaction = response.payload.transactions[0];

        if (transaction.metadata && transaction.metadata.bankAccountName) {
          request.bankAccountName = transaction.metadata.bankAccountName;
        } else if (
          transaction.payment_metadata &&
          transaction.payment_metadata.bankAccountName
        ) {
          request.bankAccountName =
            transaction.payment_metadata.bankAccountName;
        } else if (
          transaction.withdraw_request &&
          transaction.withdraw_request.bankAccountName
        ) {
          request.bankAccountName =
            transaction.withdraw_request.bankAccountName;
        }
      }

      return request;
    } catch (error) {
      console.error("Error loading withdraw detail:", error);
      return request;
    }
  };

  // Tạo mã QR để chuyển khoản
  const generateQrCode = async (request: WithdrawRequest) => {
    try {
      // Tải thông tin chi tiết trước để đảm bảo có dữ liệu chính xác
      const detailedRequest = await loadWithdrawDetail(request);
      setSelectedRequest(detailedRequest);

      // Gọi API để lấy thông tin chuyển khoản
      const response = await paymentApiRequest.getWithdrawQrCode(
        detailedRequest.id
      );

      // Xử lý kết quả từ API một cách đơn giản
      if (response?.status === 200 && response?.payload) {
        const payload = response.payload as ResponsePayload;

        if (payload.qrCodeData) {
          // Cập nhật thông tin từ API
          const { recipientInfo, qrCodeUrl, transferContent } =
            payload.qrCodeData;

          // Cập nhật thông tin người nhận
          if (recipientInfo) {
            detailedRequest.bankAccountName = recipientInfo.bankAccountName;
            detailedRequest.bankAccountNumber = recipientInfo.bankAccountNumber;
            detailedRequest.bankName = recipientInfo.bankName;
          }

          // Sử dụng URL QR từ API
          if (qrCodeUrl) {
            setQrCodeUrl(qrCodeUrl);
          }

          // Tạo URL VietQR với thông tin từ API
          const bankCode = getBankCodeFromName(detailedRequest.bankName);
          const encodedContent = encodeURIComponent(transferContent);
          const vietQrUrl = `${VIET_QR_API}/${bankCode}-${
            detailedRequest.bankAccountNumber
          }-print.png?amount=${
            detailedRequest.amount
          }&addInfo=${encodedContent}&accountName=${encodeURIComponent(
            detailedRequest.bankAccountName
          )}`;
          setVietQrUrl(vietQrUrl);

          // Cập nhật selected request
          setSelectedRequest({ ...detailedRequest });
        }
      }

      // Mở dialog hiển thị mã QR
      setOpenQrDialog(true);
    } catch (error) {
      toast.error("Đã xảy ra lỗi khi tạo mã QR");

      // Vẫn mở dialog và hiển thị QR mặc định
      if (request) {
        setSelectedRequest(request);
        const transferContent = `SEVQR #RUT${request.id}`;
        const bankCode = getBankCodeFromName(request.bankName);
        const encodedContent = encodeURIComponent(transferContent);

        // Tạo URL VietQR dự phòng khi có lỗi
        const emergencyVietQrUrl = `${VIET_QR_API}/${bankCode}-${
          request.bankAccountNumber
        }-print.png?amount=${
          request.amount
        }&addInfo=${encodedContent}&accountName=${encodeURIComponent(
          request.bankAccountName
        )}`;
        setVietQrUrl(emergencyVietQrUrl);
        setOpenQrDialog(true);
      }
    }
  };

  // Chuyển đổi giữa SePay QR và VietQR
  const toggleQrType = () => {
    setShowVietQr(!showVietQr);
  };

  // Lấy mã ngân hàng từ tên ngân hàng
  const getBankCodeFromName = (bankName: string): string => {
    const bankCodes: Record<string, string> = {
      VietinBank: "ICB",
      Vietcombank: "VCB",
      BIDV: "BIDV",
      Agribank: "AGR",
      Techcombank: "TCB",
      MBBank: "MB",
      ACB: "ACB",
      VPBank: "VPB",
      TPBank: "TPB",
      CAKE: "CAKE",
    };

    for (const [key, value] of Object.entries(bankCodes)) {
      if (bankName.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }

    return "ICB"; // Mặc định là VietinBank nếu không tìm thấy
  };

  // Copy thông tin vào clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => toast.success("Đã sao chép vào clipboard"))
      .catch(() => toast.error("Không thể sao chép"));
  };

  // Xử lý lọc theo trạng thái
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  // Xử lý từ chối yêu cầu rút tiền
  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingId(selectedRequest.id);
      const response = await paymentApiRequest.processWithdrawRequest(
        selectedRequest.id,
        {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Yêu cầu không hợp lệ",
        }
      );

      if (response.status === 200) {
        toast.success("Đã từ chối yêu cầu rút tiền");
        setSelectedRequest(null);
        setRejectionReason("");
        fetchWithdrawRequests(statusFilter);
      } else {
        toast.error("Không thể từ chối yêu cầu");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi xử lý yêu cầu");
    } finally {
      setProcessingId(null);
    }
  };

  // Hiển thị trạng thái dưới dạng Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Đã duyệt</Badge>;
      case "CANCELED":
        return <Badge variant="destructive">Đã từ chối</Badge>;
      case "PENDING":
        return <Badge variant="outline">Đang chờ</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Khi admin xác nhận đã chuyển khoản (giữ lại cho trường hợp cần xác nhận thủ công)
  const handleConfirmTransfer = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingId(selectedRequest.id);
      const response = await paymentApiRequest.processWithdrawRequest(
        selectedRequest.id,
        { status: "COMPLETED" }
      );

      if (response.status === 200) {
        toast.success("Đã xác nhận chuyển khoản thành công");
        setOpenQrDialog(false);
        setQrCodeUrl(null);
        setSelectedRequest(null);
        fetchWithdrawRequests(statusFilter);
      } else {
        toast.error("Không thể cập nhật trạng thái yêu cầu");
      }
    } catch (err) {
      toast.error("Đã xảy ra lỗi khi xử lý yêu cầu");
    } finally {
      setProcessingId(null);
    }
  };

  // Hàm tải ảnh QR
  const downloadQRCode = () => {
    if (!qrImageRef.current) return;

    // Tạo canvas
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return;

    const image = qrImageRef.current;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    try {
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `rently-withdraw-qr-${
        selectedRequest?.id || "payment"
      }.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Đã tải QR code thành công");
    } catch (error) {
      toast.error("Không thể tải QR code");
    }
  };

  // Khi component unmount, hủy các đăng ký sự kiện
  useEffect(() => {
    return () => {
      // Cleanup function khi component unmount
      if (socket) {
        socket.off("withdraw-confirm");
        socket.off("paymentStatusUpdated");
        socket.off("joinAdminRoomResponse");
      }
    };
  }, [socket]);

  return (
    <SidebarInset>
      <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-2 md:px-4 w-full sticky top-0 bg-background z-10">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-base md:text-lg font-semibold">
          Quản lý yêu cầu rút tiền
        </h1>
      </header>

      <div className="p-2 md:p-4 space-y-4 overflow-y-auto overflow-x-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={handleStatusFilterChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả yêu cầu</SelectItem>
                <SelectItem value="PENDING">Đang chờ</SelectItem>
                <SelectItem value="COMPLETED">Đã duyệt</SelectItem>
                <SelectItem value="CANCELED">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchWithdrawRequests(statusFilter)}
            disabled={loading}
          >
            Làm mới
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex gap-2 items-center">
              <ArrowDownToLine size={20} />
              Danh sách yêu cầu rút tiền
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : error ? (
              <div className="text-center text-red-500 py-4">{error}</div>
            ) : withdrawRequests.length === 0 ? (
              <div className="text-center py-4">
                Không có yêu cầu rút tiền nào
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Người dùng</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Ngân hàng</TableHead>
                      <TableHead>Số tài khoản</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {request.userName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.userEmail}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(request.amount)}
                        </TableCell>
                        <TableCell>{request.bankName}</TableCell>
                        <TableCell>{request.bankAccountNumber}</TableCell>
                        <TableCell>{request.createdAt}</TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          {request.status === "PENDING" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => generateQrCode(request)}
                              >
                                <QrCode className="h-4 w-4 mr-1" />
                                Tạo QR
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8"
                                    onClick={() => setSelectedRequest(request)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Từ chối
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Xác nhận từ chối yêu cầu rút tiền
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <p>
                                        Bạn có chắc muốn từ chối yêu cầu rút
                                        tiền này không? Số tiền sẽ được hoàn lại
                                        vào tài khoản của người dùng.
                                      </p>
                                      <div className="grid gap-2">
                                        <Label htmlFor="reason">
                                          Lý do từ chối
                                        </Label>
                                        <Input
                                          id="reason"
                                          value={rejectionReason}
                                          onChange={(e) =>
                                            setRejectionReason(e.target.value)
                                          }
                                          placeholder="Nhập lý do từ chối"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedRequest(null);
                                        setRejectionReason("");
                                      }}
                                    >
                                      Hủy
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={handleRejectRequest}
                                      disabled={
                                        processingId === selectedRequest?.id
                                      }
                                    >
                                      Xác nhận từ chối
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                          {request.status !== "PENDING" && (
                            <div className="text-sm text-muted-foreground">
                              Đã xử lý
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog hiển thị mã QR để chuyển khoản */}
      <Dialog open={openQrDialog} onOpenChange={setOpenQrDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <DialogTitle className="text-lg">
                  Quét mã QR để chuyển khoản
                </DialogTitle>
              </div>
              {selectedRequest && (
                <Badge variant="outline" className="px-3 py-1">
                  <span className="font-medium">
                    {formatPrice(selectedRequest.amount)}
                  </span>
                </Badge>
              )}
            </div>
            <DialogDescription>
              Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử
            </DialogDescription>
          </DialogHeader>

          <div className="p-0 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
              {/* QR Code Section */}
              <div className="flex flex-col items-center justify-center p-6 bg-white">
                {/* Toggle QR Type Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleQrType}
                  className="mb-4 text-xs"
                >
                  {showVietQr ? "Sử dụng SePay QR" : "Sử dụng VietQR"}
                </Button>

                <div className="border rounded-xl p-4 bg-white shadow-sm flex flex-col items-center">
                  {selectedRequest && (
                    <>
                      {/* Hiển thị loại QR đang sử dụng */}
                      <div className="text-sm mb-2">
                        {selectedRequest.bankName} -{" "}
                        {showVietQr ? "VietQR" : "SePay QR"}
                      </div>

                      {/* Hiển thị mã QR */}
                      {(showVietQr && vietQrUrl) ||
                      (!showVietQr && qrCodeUrl) ? (
                        <img
                          src={showVietQr ? vietQrUrl || "" : qrCodeUrl || ""}
                          alt="QR Code"
                          width={240}
                          height={240}
                          className="mx-auto"
                          ref={qrImageRef}
                          onError={(e) => {
                            // Nếu lỗi, chuyển sang VietQR
                            if (!showVietQr && vietQrUrl) {
                              setShowVietQr(true);
                              toast.info(
                                "Đã chuyển sang VietQR do SePay QR không tải được"
                              );
                            } else {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              toast.error("Không thể tải mã QR");
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-[240px] w-[240px]">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Nút tải ảnh QR */}
                  <button
                    onClick={downloadQRCode}
                    className="mt-4 flex items-center gap-1 text-blue-600 border border-blue-200 rounded-md px-3 py-1 text-sm hover:bg-blue-50 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Tải ảnh QR
                  </button>
                </div>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Vui lòng không tắt trang này cho đến khi thanh toán hoàn tất
                </p>
              </div>

              {/* Bank Info Section */}
              {selectedRequest && (
                <div className="p-6 space-y-5 bg-muted/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BanknoteIcon className="h-5 w-5 text-primary" />
                      <h3 className="font-medium">Thông tin chuyển khoản</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Hoặc bạn có thể chuyển khoản thủ công với thông tin sau
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      {/* Người nhận */}
                      <div className="flex flex-col rounded-lg border bg-white p-3">
                        <div className="text-muted-foreground mb-1">
                          Người nhận:
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {selectedRequest.bankAccountName}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 hover:bg-primary/10"
                            onClick={() =>
                              copyToClipboard(selectedRequest.bankAccountName)
                            }
                          >
                            <CopyIcon className="h-3 w-3 mr-1" />
                            <span className="text-xs">Sao chép</span>
                          </Button>
                        </div>
                      </div>

                      {/* Ngân hàng */}
                      <div className="flex flex-col rounded-lg border bg-white p-3">
                        <div className="text-muted-foreground mb-1">
                          Ngân hàng:
                        </div>
                        <div className="font-medium">
                          {selectedRequest.bankName}
                        </div>
                      </div>

                      {/* Số tài khoản */}
                      <div className="flex flex-col rounded-lg border bg-white p-3">
                        <div className="text-muted-foreground mb-1">
                          Số tài khoản:
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {selectedRequest.bankAccountNumber}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 hover:bg-primary/10"
                            onClick={() =>
                              copyToClipboard(selectedRequest.bankAccountNumber)
                            }
                          >
                            <CopyIcon className="h-3 w-3 mr-1" />
                            <span className="text-xs">Sao chép</span>
                          </Button>
                        </div>
                      </div>

                      {/* Số tiền */}
                      <div className="flex flex-col rounded-lg border bg-white p-3">
                        <div className="text-muted-foreground mb-1">
                          Số tiền:
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {formatPrice(selectedRequest.amount)}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 hover:bg-primary/10"
                            onClick={() =>
                              copyToClipboard(selectedRequest.amount.toString())
                            }
                          >
                            <CopyIcon className="h-3 w-3 mr-1" />
                            <span className="text-xs">Sao chép</span>
                          </Button>
                        </div>
                      </div>

                      {/* Nội dung chuyển khoản */}
                      <div className="flex flex-col rounded-lg border bg-white p-3">
                        <div className="text-muted-foreground mb-1">
                          Nội dung chuyển khoản:
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="font-medium font-mono">{`SEVQR #RUT${selectedRequest.id}`}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 hover:bg-primary/10"
                            onClick={() =>
                              copyToClipboard(`SEVQR #RUT${selectedRequest.id}`)
                            }
                          >
                            <CopyIcon className="h-3 w-3 mr-1" />
                            <span className="text-xs">Sao chép</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="border-primary/20 bg-primary/5">
                    <AlertCircleIcon className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-sm">
                      Lưu ý quan trọng
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      Hãy giữ nguyên nội dung chuyển khoản để hệ thống có thể
                      xác nhận giao dịch.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setOpenQrDialog(false);
                setQrCodeUrl(null);
                setVietQrUrl(null);
              }}
            >
              Hủy
            </Button>
            <Button
              variant="default"
              className="bg-green-500 hover:bg-green-600"
              onClick={handleConfirmTransfer}
              disabled={processingId === selectedRequest?.id}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Xác nhận thủ công (nếu không tự động)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  );
};

export default WithdrawManagementPage;
