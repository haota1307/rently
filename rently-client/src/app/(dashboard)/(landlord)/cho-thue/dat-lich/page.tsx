"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CalendarIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Trash2Icon,
  CheckIcon,
  XIcon,
  UserCircle,
  Phone,
  Mail,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { Role, RoleType } from "@/constants/type";
import { useAppStore } from "@/components/app-provider";
import { useViewingSchedule } from "@/features/viewing-schedule/useViewingSchedule";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Kiểu dữ liệu cho trạng thái lịch xem phòng
type ScheduleStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RESCHEDULED"
  | "WAITING_TENANT_CONFIRM";
type TabType = "ALL" | ScheduleStatus;

interface ViewingSchedule {
  id: number;
  post: {
    id: number;
    title: string;
  };
  viewingDate: string;
  status: ScheduleStatus;
  note: string | null;
  tenant?: {
    name: string;
    phoneNumber: string;
    email?: string;
  };
}

export default function LandlordViewingSchedulePage() {
  const { role } = useAppStore();
  const [currentTab, setCurrentTab] = useState<TabType>("PENDING");
  const [selectedSchedule, setSelectedSchedule] =
    useState<ViewingSchedule | null>(null);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [note, setNote] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("09:00");

  // Kiểu dữ liệu cho tham số query
  type QueryParams = {
    status?: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED" | undefined;
    role: RoleType;
  };

  // Tạo tham số query với kiểu dữ liệu đúng
  const queryParams: QueryParams = {
    status:
      currentTab === "ALL"
        ? undefined
        : currentTab === "WAITING_TENANT_CONFIRM"
          ? "RESCHEDULED"
          : (currentTab as "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED"),
    role: Role.Landlord,
  };

  const { data, isLoading, refetch } =
    useViewingSchedule().getViewingSchedules(queryParams);

  const { updateViewingSchedule } = useViewingSchedule();

  const handleApprove = async () => {
    if (!selectedSchedule) return;

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: {
          status: "APPROVED",
          note: note || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã duyệt lịch xem phòng");
          setIsApproveOpen(false);
          setNote("");
          refetch();
        },
        onError: (error) => {
          toast.error("Có lỗi xảy ra, vui lòng thử lại");
        },
      }
    );
  };

  const handleReject = async () => {
    if (!selectedSchedule) return;

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: {
          status: "REJECTED",
          note: note || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã từ chối lịch xem phòng");
          setIsRejectOpen(false);
          setNote("");
          refetch();
        },
        onError: (error) => {
          toast.error("Có lỗi xảy ra, vui lòng thử lại");
        },
      }
    );
  };

  const handleReschedule = async () => {
    if (!selectedSchedule || !selectedDate) return;

    // Kết hợp ngày và giờ đã chọn
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const dateWithTime = new Date(selectedDate);
    dateWithTime.setHours(hours, minutes, 0, 0);

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: {
          status: "RESCHEDULED",
          rescheduledDate: dateWithTime.toISOString(),
          note: `Đổi lịch: ${
            note || "Không có lý do"
          }. Đang chờ người thuê xác nhận.`,
        },
      },
      {
        onSuccess: () => {
          toast.success(
            "Đã đổi lịch xem phòng và đang chờ người thuê xác nhận"
          );
          setIsRescheduleOpen(false);
          setNote("");
          setSelectedDate(undefined);
          setSelectedTime("09:00");
          refetch();
        },
        onError: (error) => {
          toast.error("Có lỗi xảy ra, vui lòng thử lại");
        },
      }
    );
  };

  const handleCancel = async () => {
    if (!selectedSchedule) return;

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: {
          status: "REJECTED",
          note: `Đã hủy bởi chủ nhà: ${note || "Không có lý do"}`,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã hủy lịch xem phòng");
          setIsCancelOpen(false);
          setNote("");
          refetch();
        },
        onError: (error) => {
          toast.error("Có lỗi xảy ra, vui lòng thử lại");
        },
      }
    );
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-50 text-yellow-700 border-yellow-200"
          >
            Đang chờ xác nhận
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Đã xác nhận
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Đã hủy
          </Badge>
        );
      case "RESCHEDULED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Đã đổi lịch
          </Badge>
        );
      case "WAITING_TENANT_CONFIRM":
        return (
          <Badge
            variant="outline"
            className="bg-purple-50 text-purple-700 border-purple-200"
          >
            Chờ người thuê xác nhận
          </Badge>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (data?.data) {
      console.log("Viewing schedules data in landlord dashboard:", data.data);
    }
  }, [data]);

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 w-full">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 " />
        <h1 className="text-lg font-semibold">Lịch đặt xem phòng</h1>
      </header>

      <div className="m-4 space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Hướng dẫn</AlertTitle>
          <AlertDescription>
            Quản lý các lịch đặt xem phòng từ khách hàng. Bạn có thể chấp nhận,
            từ chối hoặc đổi lịch theo yêu cầu.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card className="bg-blue-50">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                <CardTitle className="text-xs md:text-sm font-medium text-blue-700 line-clamp-1">
                  Chấp nhận
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1 md:mt-2 text-blue-600 hidden md:block">
                Xác nhận lịch xem phòng với khách hàng
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-amber-50">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                <CardTitle className="text-xs md:text-sm font-medium text-amber-700 line-clamp-1">
                  Đổi lịch
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1 md:mt-2 text-amber-600 hidden md:block">
                Đề xuất thời gian xem phòng khác
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-red-50">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                <CardTitle className="text-xs md:text-sm font-medium text-red-700 line-clamp-1">
                  Từ chối
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1 md:mt-2 text-red-600 hidden md:block">
                Từ chối yêu cầu xem phòng với lý do
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-4 w-4 md:h-5 md:w-5 text-green-500" />
                <CardTitle className="text-xs md:text-sm font-medium text-green-700 line-clamp-1">
                  Lịch trình
                </CardTitle>
              </div>
              <CardDescription className="text-xs mt-1 md:mt-2 text-green-600 hidden md:block">
                Xem tất cả lịch đặt theo ngày
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quản lý lịch đặt xem</CardTitle>
            <CardDescription>
              Danh sách các lịch đặt xem phòng từ khách hàng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue="PENDING"
              value={currentTab}
              onValueChange={(value) => setCurrentTab(value as TabType)}
              className="w-full mb-6"
            >
              <div className="overflow-x-auto pb-2">
                <TabsList className="mb-4 flex w-auto min-w-max">
                  <TabsTrigger value="ALL">Tất cả</TabsTrigger>
                  <TabsTrigger value="PENDING">Đang chờ xác nhận</TabsTrigger>
                  <TabsTrigger value="WAITING_TENANT_CONFIRM">
                    Chờ người thuê xác nhận
                  </TabsTrigger>
                  <TabsTrigger value="APPROVED">Đã xác nhận</TabsTrigger>
                  <TabsTrigger value="REJECTED">Đã hủy</TabsTrigger>
                  <TabsTrigger value="RESCHEDULED">Đã đổi lịch</TabsTrigger>
                </TabsList>
              </div>

              <div>
                {isLoading ? (
                  <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                ) : data?.data?.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    Không có lịch xem phòng nào trong danh sách này
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="whitespace-nowrap">
                              Bài đăng
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Ngày xem
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Trạng thái
                            </TableHead>
                            <TableHead className="whitespace-nowrap">
                              Ghi chú
                            </TableHead>
                            <TableHead className="text-right whitespace-nowrap">
                              Thao tác
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data?.data?.map((schedule: ViewingSchedule) => {
                            // Kiểm tra xem có phải trạng thái chờ xác nhận từ người thuê không
                            const isWaitingTenantConfirm =
                              schedule.status === "RESCHEDULED" &&
                              schedule.note?.includes(
                                "Đang chờ người thuê xác nhận"
                              );

                            return (
                              <TableRow
                                key={schedule.id}
                                className={cn(
                                  "hover:bg-muted/30",
                                  isWaitingTenantConfirm && "bg-purple-50/50"
                                )}
                              >
                                <TableCell>
                                  <Link
                                    href={`/bai-dang/${schedule.post.id}`}
                                    className="hover:underline font-medium text-primary"
                                  >
                                    {schedule.post.title}
                                  </Link>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>
                                      {format(
                                        new Date(schedule.viewingDate),
                                        "PPP",
                                        {
                                          locale: vi,
                                        }
                                      )}
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                      {format(
                                        new Date(schedule.viewingDate),
                                        "HH:mm",
                                        {
                                          locale: vi,
                                        }
                                      )}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {isWaitingTenantConfirm
                                    ? getStatusBadge("WAITING_TENANT_CONFIRM")
                                    : getStatusBadge(schedule.status)}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {schedule.note || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="px-2 h-8 w-8"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setSelectedSchedule(schedule);
                                          setIsInfoOpen(true);
                                        }}
                                      >
                                        <UserCircle className="w-4 h-4 mr-2" />{" "}
                                        Xem thông tin người đặt
                                      </DropdownMenuItem>

                                      {schedule.status === "PENDING" && (
                                        <>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedSchedule(schedule);
                                              setIsApproveOpen(true);
                                            }}
                                          >
                                            <CheckIcon className="w-4 h-4 mr-2" />{" "}
                                            Duyệt lịch
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedSchedule(schedule);
                                              setIsRescheduleOpen(true);
                                            }}
                                          >
                                            <Clock className="w-4 h-4 mr-2" />{" "}
                                            Đổi lịch
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() => {
                                              setSelectedSchedule(schedule);
                                              setIsRejectOpen(true);
                                            }}
                                            className="text-red-500"
                                          >
                                            <XIcon className="w-4 h-4 mr-2" />{" "}
                                            Từ chối
                                          </DropdownMenuItem>
                                        </>
                                      )}

                                      {schedule.status === "RESCHEDULED" &&
                                        !isWaitingTenantConfirm && (
                                          <>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedSchedule(schedule);
                                                setIsApproveOpen(true);
                                              }}
                                            >
                                              <CheckIcon className="w-4 h-4 mr-2" />{" "}
                                              Xác nhận lịch
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedSchedule(schedule);
                                                setIsRescheduleOpen(true);
                                              }}
                                            >
                                              <Clock className="w-4 h-4 mr-2" />{" "}
                                              Đổi lịch lại
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => {
                                                setSelectedSchedule(schedule);
                                                setIsRejectOpen(true);
                                              }}
                                              className="text-red-500"
                                            >
                                              <XIcon className="w-4 h-4 mr-2" />{" "}
                                              Từ chối
                                            </DropdownMenuItem>
                                          </>
                                        )}

                                      {isWaitingTenantConfirm && (
                                        <DropdownMenuItem
                                          disabled
                                          className="text-purple-600 opacity-60"
                                        >
                                          <Clock className="w-4 h-4 mr-2" />{" "}
                                          Đang chờ xác nhận
                                        </DropdownMenuItem>
                                      )}

                                      {(schedule.status === "APPROVED" ||
                                        (schedule.status === "RESCHEDULED" &&
                                          !isWaitingTenantConfirm)) && (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setSelectedSchedule(schedule);
                                            setIsCancelOpen(true);
                                          }}
                                          className="text-red-500"
                                        >
                                          <Trash2Icon className="w-4 h-4 mr-2" />{" "}
                                          Hủy lịch
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Dialog duyệt lịch */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Xác nhận lịch xem phòng</DialogTitle>
            <DialogDescription>
              Bạn đồng ý với thời gian xem phòng này?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Ghi chú (nếu có)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsApproveOpen(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              onClick={handleApprove}
              disabled={updateViewingSchedule.isPending}
              className="w-full sm:w-auto"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog từ chối lịch */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Từ chối lịch xem phòng</DialogTitle>
            <DialogDescription>
              Vui lòng cho biết lý do từ chối (nếu có)
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Lý do từ chối"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReject}
              disabled={updateViewingSchedule.isPending}
              className="w-full sm:w-auto"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog đổi lịch */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đổi lịch xem phòng</DialogTitle>
            <DialogDescription>
              Chọn ngày và giờ mới để đổi lịch xem phòng
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Chọn ngày
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={"w-full justify-start text-left font-normal"}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: vi })
                      ) : (
                        <span>Chọn ngày</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Chọn giờ
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full"
                    min="08:00"
                    max="20:00"
                    step="1800" // 30 phút
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Giờ xem từ 8:00 đến 20:00
                </p>
              </div>
            </div>

            <div className="grid gap-2 mt-2">
              <label className="text-sm font-medium mb-1 block">Ghi chú</label>
              <Textarea
                placeholder="Ghi chú (nếu có)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsRescheduleOpen(false)}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || updateViewingSchedule.isPending}
              className="w-full sm:w-auto"
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog hủy lịch */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle>Hủy lịch xem phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy lịch xem phòng này?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              placeholder="Lý do hủy lịch"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsCancelOpen(false)}
              className="w-full sm:w-auto"
            >
              Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={updateViewingSchedule.isPending}
              className="w-full sm:w-auto"
            >
              Hủy lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thông tin người đặt lịch */}
      <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
        <DialogContent className="max-w-md sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Thông tin người đặt lịch</DialogTitle>
            <DialogDescription>
              Chi tiết về người đã đặt lịch xem phòng
            </DialogDescription>
          </DialogHeader>
          {selectedSchedule && (
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 p-2 rounded-full">
                  <UserCircle className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium break-words">
                    {selectedSchedule.tenant?.name || "Chưa có thông tin"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Người đặt lịch xem
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {selectedSchedule.tenant?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-sm break-all">
                      {selectedSchedule.tenant.email}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedSchedule.tenant?.phoneNumber ||
                      "Chưa có số điện thoại"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Thời gian đặt lịch</h4>
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                    <span className="text-sm">
                      {selectedSchedule.viewingDate &&
                        format(new Date(selectedSchedule.viewingDate), "PPP", {
                          locale: vi,
                        })}
                      &nbsp;lúc&nbsp;
                      {selectedSchedule.viewingDate &&
                        format(
                          new Date(selectedSchedule.viewingDate),
                          "HH:mm",
                          { locale: vi }
                        )}
                    </span>
                  </div>
                </div>
              </div>

              {selectedSchedule.note && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Ghi chú</h4>
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm">{selectedSchedule.note}</p>
                  </div>
                </div>
              )}

              <Separator className="mt-4" />

              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  <strong>Lưu ý:</strong> Để xem đầy đủ thông tin liên hệ của
                  người thuê, vui lòng kiểm tra trong hệ thống quản trị hoặc tin
                  nhắn.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInfoOpen(false)}>
              Đóng
            </Button>
            {selectedSchedule?.tenant?.phoneNumber && (
              <Button
                variant="default"
                onClick={() => {
                  if (selectedSchedule?.tenant?.phoneNumber) {
                    window.open(
                      `tel:${selectedSchedule.tenant.phoneNumber}`,
                      "_blank"
                    );
                  }
                }}
              >
                <Phone className="w-4 h-4 mr-1" /> Gọi điện
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  );
}
