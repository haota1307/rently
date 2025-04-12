import http from "@/lib/http";
import { RoleType } from "@/constants/type";

interface ViewingScheduleResponse {
  data: {
    id: number;
    post: {
      id: number;
      title: string;
    };
    viewingDate: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
    note: string | null;
  }[];
  total: number;
}

export const viewingScheduleApi = {
  create: (data: { postId: number; viewingDate: string; note?: string }) => {
    return http.post<ViewingScheduleResponse>("/viewing-schedules", data);
  },

  update: (
    id: number,
    data: {
      status: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
      rescheduledDate?: string;
      note?: string;
    }
  ) => {
    return http.put<ViewingScheduleResponse>(`/viewing-schedules/${id}`, data);
  },

  getList: (query?: {
    page?: number;
    limit?: number;
    status?: "PENDING" | "APPROVED" | "REJECTED" | "RESCHEDULED";
    role?: RoleType;
  }) => {
    const safeQuery = {
      ...query,
      page: query?.page ? Number(query.page) : 1,
      limit: query?.limit ? Number(query.limit) : 10,
    };

    const queryString = safeQuery
      ? `?${new URLSearchParams(
          Object.entries(safeQuery)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()}`
      : "";
    return http.get<ViewingScheduleResponse>(
      `/viewing-schedules${queryString}`
    );
  },

  getById: (id: number) => {
    return http.get<ViewingScheduleResponse>(`/viewing-schedules/${id}`);
  },
};
