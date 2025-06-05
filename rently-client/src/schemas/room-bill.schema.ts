import { z } from "zod";
import { RoomSchema } from "@/schemas/room.schema";

export const OtherFeeSchema = z.object({
  name: z.string(),
  amount: z.number(),
});

export const RoomBillSchema = z.object({
  id: z.number(),
  roomId: z.number(),
  electricityOld: z.coerce.number(),
  electricityNew: z.coerce.number(),
  electricityPrice: z.coerce.number(),
  waterOld: z.coerce.number(),
  waterNew: z.coerce.number(),
  waterPrice: z.coerce.number(),
  otherFees: z.array(OtherFeeSchema).optional().nullable(),
  totalAmount: z.coerce.number(),
  note: z.string().optional().nullable(),
  isPaid: z.boolean(),
  billingMonth: z.coerce.date(),
  dueDate: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdById: z.number(),
  emailSent: z.boolean(),
  room: RoomSchema.optional(),
});

export const CreateRoomBillSchema = z
  .object({
    roomId: z.number(),
    electricityOld: z.coerce.number().min(0, "Chỉ số điện cũ không được âm"),
    electricityNew: z.coerce.number().min(0, "Chỉ số điện mới không được âm"),
    electricityPrice: z.coerce
      .number()
      .min(0, "Giá điện không được âm")
      .default(3500),
    waterOld: z.coerce.number().min(0, "Chỉ số nước cũ không được âm"),
    waterNew: z.coerce.number().min(0, "Chỉ số nước mới không được âm"),
    waterPrice: z.coerce
      .number()
      .min(0, "Giá nước không được âm")
      .default(15000),
    otherFees: z.array(OtherFeeSchema).optional(),
    totalAmount: z.number(),
    note: z.string().optional(),
    billingMonth: z.coerce.date(),
    dueDate: z.coerce.date(),
  })
  .refine((data) => data.electricityNew >= data.electricityOld, {
    message: "Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số cũ",
    path: ["electricityNew"],
  })
  .refine((data) => data.waterNew >= data.waterOld, {
    message: "Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số cũ",
    path: ["waterNew"],
  });

export const UpdateRoomBillSchema = z
  .object({
    roomId: z.number().optional(),
    electricityOld: z.coerce
      .number()
      .min(0, "Chỉ số điện cũ không được âm")
      .optional(),
    electricityNew: z.coerce
      .number()
      .min(0, "Chỉ số điện mới không được âm")
      .optional(),
    electricityPrice: z.coerce
      .number()
      .min(0, "Giá điện không được âm")
      .optional(),
    waterOld: z.coerce
      .number()
      .min(0, "Chỉ số nước cũ không được âm")
      .optional(),
    waterNew: z.coerce
      .number()
      .min(0, "Chỉ số nước mới không được âm")
      .optional(),
    waterPrice: z.coerce.number().min(0, "Giá nước không được âm").optional(),
    otherFees: z.array(OtherFeeSchema).optional(),
    totalAmount: z.coerce.number().optional(),
    note: z.string().optional(),
    billingMonth: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
    isPaid: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (
        data.electricityNew !== undefined &&
        data.electricityOld !== undefined
      ) {
        return data.electricityNew >= data.electricityOld;
      }
      return true;
    },
    {
      message: "Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số cũ",
      path: ["electricityNew"],
    }
  )
  .refine(
    (data) => {
      if (data.waterNew !== undefined && data.waterOld !== undefined) {
        return data.waterNew >= data.waterOld;
      }
      return true;
    },
    {
      message: "Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số cũ",
      path: ["waterNew"],
    }
  );

export const GetRoomBillQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  roomId: z.coerce.number().optional(),
  isPaid: z.coerce.boolean().optional(),
  billingMonth: z.coerce.date().optional(),
});

export const GetRoomBillsResSchema = z.object({
  data: z.array(RoomBillSchema),
  totalItems: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

export const GetRoomBillParamsSchema = z.object({
  id: z.coerce.number(),
});

export const SendBillEmailParamsSchema = z.object({
  id: z.coerce.number(),
  email: z.string().email("Email không hợp lệ"),
});

export type OtherFeeType = z.infer<typeof OtherFeeSchema>;
export type RoomBillType = z.infer<typeof RoomBillSchema>;
export type CreateRoomBillType = z.infer<typeof CreateRoomBillSchema>;
export type UpdateRoomBillType = z.infer<typeof UpdateRoomBillSchema>;
export type GetRoomBillQueryType = z.infer<typeof GetRoomBillQuerySchema>;
export type GetRoomBillsResType = z.infer<typeof GetRoomBillsResSchema>;
export type GetRoomBillParamsType = z.infer<typeof GetRoomBillParamsSchema>;
export type SendBillEmailParamsType = z.infer<typeof SendBillEmailParamsSchema>;
