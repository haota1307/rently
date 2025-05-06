import { z } from "zod";

// Enum cho các loại thông báo
export enum NotificationType {
  PAYMENT = "PAYMENT",
  INTERACTION = "INTERACTION",
  RENTAL_REQUEST = "RENTAL_REQUEST",
  VIEWING_SCHEDULE = "VIEWING_SCHEDULE",
  POST = "POST",
  SYSTEM = "SYSTEM",
}

// Schema cho notification
export const NotificationSchema = z.object({
  id: z.number(),
  userId: z.number(),
  type: z.nativeEnum(NotificationType),
  title: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  relatedId: z.number().nullable().optional(),
  relatedType: z.string().nullable().optional(),
  deepLink: z.string().nullable().optional(),
  createdAt: z.string().transform((val) => new Date(val)),
  updatedAt: z.string().transform((val) => new Date(val)),
});

// Schema cho response notification list
export const NotificationResponseSchema = z.object({
  data: z.array(NotificationSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// Schema cho response unread count
export const UnreadCountResponseSchema = z.object({
  count: z.number(),
});

// Types
export type Notification = z.infer<typeof NotificationSchema>;
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
