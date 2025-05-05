"use client";

import { useViewingSchedule } from "@/features/viewing-schedule/useViewingSchedule";
import { useAppStore } from "@/components/app-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, set } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";
import { Role } from "@/constants/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CalendarIcon,
  CheckIcon,
  XIcon,
  Trash2Icon,
  ClockIcon,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UpdateViewingScheduleData } from "@/features/viewing-schedule/viewing-schedule.api";

interface ViewingSchedule {
  id: number;
  post: {
    id: number;
    title: string;
  };
  viewingDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
  note: string | null;
  requireTenantConfirmation: boolean;
}

interface ViewingScheduleListProps {
  initialTab?: string;
}

export function ViewingScheduleList({
  initialTab = "ALL",
}: ViewingScheduleListProps) {
  const role = useAppStore((state) => state.role);
  const [status, setStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED" | "ALL"
  >("ALL");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>("09:00");
  const [note, setNote] = useState("");
  const [requireConfirmation, setRequireConfirmation] = useState(false);
  const [selectedSchedule, setSelectedSchedule] =
    useState<ViewingSchedule | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  useEffect(() => {
    // Map initialTab to status
    if (initialTab === "pending") {
      setStatus("PENDING");
    } else if (initialTab === "approved") {
      setStatus("APPROVED");
    } else if (initialTab === "rejected") {
      setStatus("REJECTED");
    } else {
      setStatus("ALL");
    }
  }, [initialTab]);

  const { data, isLoading, refetch } = useViewingSchedule().getViewingSchedules(
    {
      page: 1,
      limit: 10,
      status: status === "ALL" ? undefined : status,
      role,
    }
  );

  const { updateViewingSchedule } = useViewingSchedule();

  // Thêm log để kiểm tra dữ liệu
  useEffect(() => {
    if (data?.data) {
      console.log("Viewing schedules data:", data.data);
    }
  }, [data]);

  const handleApprove = async () => {
    if (!selectedSchedule) return;

    const updateData: UpdateViewingScheduleData = {
      status: "APPROVED",
      note: note || undefined,
      requireTenantConfirmation: requireConfirmation,
    };

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: updateData,
      },
      {
        onSuccess: () => {
          toast.success("Đã duyệt lịch xem phòng");
          setIsApproveOpen(false);
          setNote("");
          setRequireConfirmation(false);
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

    const updateData: UpdateViewingScheduleData = {
      status: "REJECTED",
      note: note || undefined,
    };

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: updateData,
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReschedule = async () => {
    if (!selectedSchedule || !selectedDate) return;

    // Kết hợp ngày và giờ đã chọn
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const dateWithTime = set(selectedDate, { hours, minutes });

    const updateData: UpdateViewingScheduleData = {
      status: "RESCHEDULED",
      rescheduledDate: dateWithTime.toISOString(),
      note: note || undefined,
      requireTenantConfirmation: requireConfirmation,
    };

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: updateData,
      },
      {
        onSuccess: () => {
          toast.success("Đã đổi lịch xem phòng");
          setIsRescheduleOpen(false);
          setNote("");
          setSelectedDate(undefined);
          setSelectedTime("09:00");
          setRequireConfirmation(false);
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

    const updateData: UpdateViewingScheduleData = {
      status: "REJECTED",
      note: `Đã hủy bởi ${
        role === Role.Landlord
          ? "chủ nhà"
          : role === Role.Admin
          ? "quản trị viên"
          : "người thuê"
      }: ${note || "Không có lý do"}`,
    };

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: updateData,
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

  const getStatusBadge = (
    status: ViewingSchedule["status"],
    requireConfirmation = false
  ) => {
    console.log(
      "Status badge:",
      status,
      "require confirmation:",
      requireConfirmation
    );
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
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              Đã xác nhận
            </Badge>
            {requireConfirmation && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                {role === Role.Landlord || role === Role.Admin
                  ? "Đang chờ người thuê xác nhận"
                  : "Cần xác nhận từ bạn"}
              </Badge>
            )}
          </div>
        );
      case "RESCHEDULED":
        return (
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              Đã đổi lịch
            </Badge>
            {requireConfirmation && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200"
              >
                {role === Role.Landlord || role === Role.Admin
                  ? "Đang chờ người thuê xác nhận"
                  : "Cần xác nhận từ bạn"}
              </Badge>
            )}
          </div>
        );
      case "REJECTED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Đã từ chối
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[200px]" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {!data?.data || data.data.length === 0 ? (
        <div className="text-center py-12 bg-muted/20 rounded-lg">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <p className="text-lg font-medium">Không có lịch xem phòng nào</p>
          <p className="text-muted-foreground">
            Bạn chưa đặt lịch xem phòng nào. Hãy tìm phòng trọ và đặt lịch ngay!
          </p>
          <Button className="mt-4" asChild>
            <Link href="/phong-tro">Tìm phòng trọ</Link>
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Bài đăng</TableHead>
              <TableHead>Ngày xem</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ghi chú</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((schedule: ViewingSchedule) => (
              <TableRow key={schedule.id} className="hover:bg-muted/30">
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
                      {format(new Date(schedule.viewingDate), "PPP", {
                        locale: vi,
                      })}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(schedule.viewingDate), "HH:mm", {
                        locale: vi,
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(
                    schedule.status,
                    schedule.requireTenantConfirmation
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {schedule.note || "-"}
                </TableCell>
                <TableCell className="text-right">
                  {/* Các nút thao tác cho trạng thái PENDING */}
                  {(role === Role.Landlord || role === Role.Admin) &&
                    schedule.status === "PENDING" && (
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setIsApproveOpen(true);
                          }}
                        >
                          <CheckIcon className="w-4 h-4 mr-1" /> Duyệt
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setIsRejectOpen(true);
                          }}
                        >
                          <XIcon className="w-4 h-4 mr-1" /> Từ chối
                        </Button>
                      </div>
                    )}

                  {role === Role.Client && schedule.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsRescheduleOpen(true);
                        }}
                      >
                        <CalendarIcon className="w-4 h-4 mr-1" /> Đổi lịch
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsCancelOpen(true);
                        }}
                      >
                        <Trash2Icon className="w-4 h-4 mr-1" /> Hủy lịch
                      </Button>
                    </div>
                  )}

                  {role === Role.Admin && schedule.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsRescheduleOpen(true);
                        }}
                      >
                        <CalendarIcon className="w-4 h-4 mr-1" /> Đổi lịch
                      </Button>
                    </div>
                  )}

                  {/* Các nút thao tác cho trạng thái APPROVED và RESCHEDULED */}
                  {(schedule.status === "APPROVED" ||
                    schedule.status === "RESCHEDULED") && (
                    <div className="flex justify-end gap-2">
                      {/* Nút xác nhận cho người thuê khi cần xác nhận lịch (dựa trên trường requireTenantConfirmation hoặc ghi chú) */}
                      {(role === Role.Client || role === Role.Admin) &&
                        (schedule.requireTenantConfirmation ||
                          (schedule.note &&
                            (schedule.note.includes(
                              "chờ người thuê xác nhận"
                            ) ||
                              schedule.note.includes(
                                "Yêu cầu xác nhận từ người thuê"
                              )))) && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              console.log("Xác nhận lịch cho:", schedule);
                              setSelectedSchedule(schedule);

                              const updateData: UpdateViewingScheduleData = {
                                // Nếu là đổi lịch, chuyển sang trạng thái đã xác nhận
                                status:
                                  schedule.status === "RESCHEDULED"
                                    ? "APPROVED"
                                    : schedule.status,
                                note:
                                  schedule.status === "APPROVED"
                                    ? `Đã xác nhận bởi ${
                                        role === Role.Admin
                                          ? "admin"
                                          : "người thuê"
                                      }`
                                    : `Đã xác nhận đổi lịch bởi ${
                                        role === Role.Admin
                                          ? "admin"
                                          : "người thuê"
                                      }`,
                                requireTenantConfirmation: false,
                              };

                              console.log("Dữ liệu cập nhật:", updateData);

                              updateViewingSchedule.mutate(
                                {
                                  id: schedule.id,
                                  data: updateData,
                                },
                                {
                                  onSuccess: () => {
                                    toast.success(
                                      schedule.status === "APPROVED"
                                        ? "Đã xác nhận lịch xem phòng"
                                        : "Đã xác nhận đổi lịch xem phòng"
                                    );
                                    refetch();
                                  },
                                  onError: (error) => {
                                    console.error("Lỗi khi xác nhận:", error);
                                    toast.error(
                                      "Có lỗi xảy ra, vui lòng thử lại"
                                    );
                                  },
                                }
                              );
                            }}
                          >
                            <CheckIcon className="w-4 h-4 mr-1" />
                            {schedule.status === "APPROVED"
                              ? "Xác nhận lịch"
                              : "Xác nhận đổi lịch"}
                          </Button>
                        )}

                      {/* Nút đổi lịch cho Admin */}
                      {role === Role.Admin &&
                        !schedule.requireTenantConfirmation && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSchedule(schedule);
                              setIsRescheduleOpen(true);
                            }}
                          >
                            <CalendarIcon className="w-4 h-4 mr-1" /> Đổi lịch
                          </Button>
                        )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setIsCancelOpen(true);
                        }}
                      >
                        <Trash2Icon className="w-4 h-4 mr-1" /> Hủy lịch
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Dialog đổi lịch */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Đổi lịch xem phòng</DialogTitle>
            <DialogDescription>
              Đổi lịch xem phòng sẽ gửi thông báo đến các bên liên quan
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
                  <ClockIcon className="h-4 w-4 text-muted-foreground" />
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

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                placeholder="Lý do đổi lịch"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {(role === Role.Landlord || role === Role.Admin) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireConfirmation"
                  checked={requireConfirmation}
                  onCheckedChange={(checked) =>
                    setRequireConfirmation(!!checked)
                  }
                />
                <Label
                  htmlFor="requireConfirmation"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Yêu cầu xác nhận từ người thuê
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRescheduleOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedDate || updateViewingSchedule.isPending}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog duyệt lịch */}
      <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận lịch xem phòng</DialogTitle>
            <DialogDescription>
              Xác nhận lịch xem phòng sẽ gửi thông báo đến người đặt lịch
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="note">Ghi chú</Label>
              <Textarea
                id="note"
                placeholder="Thêm ghi chú nếu cần"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {(role === Role.Landlord || role === Role.Admin) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="requireConfirmation"
                  checked={requireConfirmation}
                  onCheckedChange={(checked) =>
                    setRequireConfirmation(!!checked)
                  }
                />
                <Label
                  htmlFor="requireConfirmation"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Yêu cầu xác nhận từ người thuê
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleApprove}
              disabled={updateViewingSchedule.isPending}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog từ chối lịch */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối lịch xem phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn từ chối lịch xem phòng này?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Textarea
                placeholder="Lý do từ chối"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateViewingSchedule.isPending}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog hủy lịch */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy lịch xem phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy lịch xem phòng này?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Textarea
                placeholder="Lý do hủy lịch"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelOpen(false)}>
              Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={updateViewingSchedule.isPending}
            >
              Xác nhận hủy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
