import http from "@/lib/http";
import {
  NotificationResponse,
  UnreadCountResponse,
} from "@/schemas/notification.schema";

const notificationApiRequest = {
  getNotifications: (params: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  }) => {
    const { page = 1, limit = 10, isRead } = params;
    let url = `notifications?page=${page}&limit=${limit}`;

    if (isRead !== undefined) {
      url += `&isRead=${isRead}`;
    }

    return http.get<NotificationResponse>(url);
  },

  getUnreadCount: () =>
    http.get<UnreadCountResponse>("notifications/unread-count"),

  markAsRead: (notificationId: number) =>
    http.patch(`notifications/${notificationId}/read`, {}),

  markAllAsRead: () => http.patch("notifications/read-all", {}),
};

export default notificationApiRequest;
