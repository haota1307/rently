"use client";

import { useViewingSchedule } from "@/features/viewing-schedule/useViewingSchedule";
import { useAppStore } from "@/components/app-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Role } from "@/constants/type";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarIcon, CheckIcon, XIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ViewingSchedule {
  id: number;
  post: {
    id: number;
    title: string;
  };
  viewingDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
  note: string | null;
}

export function ViewingScheduleList() {
  const role = useAppStore((state) => state.role);
  const [status, setStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED" | "ALL"
  >("ALL");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [note, setNote] = useState("");
  const [selectedSchedule, setSelectedSchedule] =
    useState<ViewingSchedule | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const { data, isLoading, refetch } = useViewingSchedule().getViewingSchedules(
    {
      page: 1,
      limit: 10,
      status: status === "ALL" ? undefined : status,
      role,
    }
  );

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

    updateViewingSchedule.mutate(
      {
        id: selectedSchedule.id,
        data: {
          status: "RESCHEDULED",
          rescheduledDate: selectedDate.toISOString(),
          note: note || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã đổi lịch xem phòng");
          setIsRescheduleOpen(false);
          setNote("");
          setSelectedDate(undefined);
          refetch();
        },
        onError: (error) => {
          toast.error("Có lỗi xảy ra, vui lòng thử lại");
        },
      }
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="secondary">Đang chờ</Badge>;
      case "APPROVED":
        return <Badge variant="default">Đã duyệt</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Từ chối</Badge>;
      case "RESCHEDULED":
        return <Badge variant="outline">Đã đổi lịch</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lịch xem phòng</CardTitle>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="PENDING">Đang chờ</SelectItem>
              <SelectItem value="APPROVED">Đã duyệt</SelectItem>
              <SelectItem value="REJECTED">Từ chối</SelectItem>
              <SelectItem value="RESCHEDULED">Đã đổi lịch</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {!data?.data || data.data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Không có lịch xem phòng nào
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bài đăng</TableHead>
                  <TableHead>Ngày xem</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((schedule: ViewingSchedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>
                      <Link
                        href={`/bai-dang/${schedule.post.id}`}
                        className="hover:underline"
                      >
                        {schedule.post.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {format(new Date(schedule.viewingDate), "PPP", {
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>{schedule.note || "-"}</TableCell>
                    <TableCell className="text-right">
                      {role === Role.Landlord &&
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
                      {role === Role.Client &&
                        schedule.status === "PENDING" && (
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog đổi lịch */}
      <Dialog open={isRescheduleOpen} onOpenChange={setIsRescheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi lịch xem phòng</DialogTitle>
            <DialogDescription>
              Chọn ngày mới để đổi lịch xem phòng
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
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
            <div className="grid gap-2">
              <Textarea
                placeholder="Ghi chú (nếu có)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duyệt lịch xem phòng</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn duyệt lịch xem phòng này?
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Textarea
                placeholder="Ghi chú (nếu có)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
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
    </>
  );
}
