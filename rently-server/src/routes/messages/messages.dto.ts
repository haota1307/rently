import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

// Tạo tin nhắn mới
export const CreateMessageBodySchema = z
  .object({
    conversationId: z.number({
      required_error: 'Vui lòng chọn cuộc trò chuyện',
    }),
    content: z
      .string({ required_error: 'Vui lòng nhập nội dung tin nhắn' })
      .min(1, 'Nội dung tin nhắn không được để trống'),
  })
  .strict()

export class CreateMessageBodyDTO extends createZodDto(
  CreateMessageBodySchema
) {}
export type CreateMessageBodyType = z.infer<typeof CreateMessageBodySchema>

// Tạo cuộc trò chuyện mới
export const CreateConversationBodySchema = z
  .object({
    userTwoId: z.number({ required_error: 'Vui lòng chọn người nhận' }),
    initialMessage: z.string().optional(),
  })
  .strict()

export class CreateConversationBodyDTO extends createZodDto(
  CreateConversationBodySchema
) {}
export type CreateConversationBodyType = z.infer<
  typeof CreateConversationBodySchema
>

// Lấy danh sách cuộc trò chuyện
export const GetConversationsQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform(val => Number(val) || 1),
    limit: z
      .string()
      .optional()
      .transform(val => Number(val) || 10),
    search: z.string().optional(),
  })
  .strict()

export class GetConversationsQueryDTO extends createZodDto(
  GetConversationsQuerySchema
) {}
export type GetConversationsQueryType = z.infer<
  typeof GetConversationsQuerySchema
>

// Lấy tin nhắn của cuộc trò chuyện
export const GetMessagesParamsSchema = z
  .object({
    conversationId: z.string().transform(val => Number(val)),
  })
  .strict()

export class GetMessagesParamsDTO extends createZodDto(
  GetMessagesParamsSchema
) {}
export type GetMessagesParamsType = z.infer<typeof GetMessagesParamsSchema>

// Lấy danh sách tin nhắn
export const GetMessagesQuerySchema = z
  .object({
    page: z
      .string()
      .optional()
      .transform(val => Number(val) || 1),
    limit: z
      .string()
      .optional()
      .transform(val => Number(val) || 20),
  })
  .strict()

export class GetMessagesQueryDTO extends createZodDto(GetMessagesQuerySchema) {}
export type GetMessagesQueryType = z.infer<typeof GetMessagesQuerySchema>

// Schema cho response của tin nhắn
export const ConversationMessageSchema = z.object({
  id: z.number(),
  content: z.string(),
  isRead: z.boolean(),
  createdAt: z.date(),
  conversationId: z.number(),
  senderId: z.number(),
  sender: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string().nullable(),
  }),
})

export type ConversationMessageType = z.infer<typeof ConversationMessageSchema>

// Schema cho response của cuộc trò chuyện
export const ConversationSchema = z.object({
  id: z.number(),
  createdAt: z.date(),
  userOneId: z.number(),
  userTwoId: z.number(),
  userOne: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string().nullable(),
  }),
  userTwo: z.object({
    id: z.number(),
    name: z.string(),
    avatar: z.string().nullable(),
  }),
  latestMessage: ConversationMessageSchema.nullable(),
  unreadCount: z.number(),
})

export type ConversationType = z.infer<typeof ConversationSchema>

// Schema cho response khi lấy danh sách cuộc trò chuyện
export const GetConversationsResSchema = z.object({
  data: z.array(ConversationSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export type GetConversationsResType = z.infer<typeof GetConversationsResSchema>

// Schema cho response khi lấy danh sách tin nhắn
export const GetMessagesResSchema = z.object({
  data: z.array(ConversationMessageSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
})

export type GetMessagesResType = z.infer<typeof GetMessagesResSchema>
