import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  viewingScheduleApi,
  UpdateViewingScheduleData,
} from "./viewing-schedule.api";

export const useViewingSchedule = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const createViewingSchedule = useMutation({
    mutationFn: async (data: {
      postId: number;
      viewingDate: string;
      note?: string;
    }) => {
      console.log("Creating viewing schedule with data:", data);
      try {
        const res = await viewingScheduleApi.create(data);
        console.log("Viewing schedule creation response:", res);
        return res.payload;
      } catch (error) {
        console.error("Viewing schedule API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đặt lịch xem phòng thành công");
      queryClient.invalidateQueries({ queryKey: ["viewing-schedules"] });
      router.push("/tai-khoan/lich-hen");
    },
    onError: (error: any) => {
      console.error("Viewing schedule creation error:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Có lỗi xảy ra khi đặt lịch. Vui lòng thử lại!";
      toast.error(errorMsg);
    },
  });

  const updateViewingSchedule = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: UpdateViewingScheduleData;
    }) => {
      const res = await viewingScheduleApi.update(id, data);
      return res.payload;
    },
    onSuccess: () => {
      toast.success("Cập nhật lịch xem phòng thành công");
      queryClient.invalidateQueries({ queryKey: ["viewing-schedules"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra");
    },
  });

  const getViewingSchedules = (query?: {
    page?: number;
    limit?: number;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
    role?: "ADMIN" | "LANDLORD" | "CLIENT";
  }) => {
    return useQuery({
      queryKey: ["viewing-schedules", query],
      queryFn: async () => {
        const res = await viewingScheduleApi.getList(query);
        return res.payload;
      },
    });
  };

  const getViewingScheduleById = (id: number) => {
    return useQuery({
      queryKey: ["viewing-schedule", id],
      queryFn: async () => {
        const res = await viewingScheduleApi.getById(id);
        return res.payload;
      },
    });
  };

  return {
    createViewingSchedule,
    updateViewingSchedule,
    getViewingSchedules,
    getViewingScheduleById,
  };
};
