import { z } from "zod";
import { ContractStatus } from "./contract.constants";

// Schema cho việc tạo hợp đồng mới
export const createContractSchema = z
  .object({
    rentalRequestId: z.number({
      required_error: "Vui lòng chọn yêu cầu thuê",
    }),
    templateId: z.number().optional(),
    startDate: z.date({
      required_error: "Vui lòng chọn ngày bắt đầu",
    }),
    endDate: z
      .date({
        required_error: "Vui lòng chọn ngày kết thúc",
      })
      .refine(
        (date) => {
          return true; // Will be validated in superRefine below
        },
        {
          message: "Ngày kết thúc phải sau ngày bắt đầu",
        }
      ),
    monthlyRent: z
      .number({
        required_error: "Vui lòng nhập giá thuê hàng tháng",
      })
      .min(1, "Giá thuê phải lớn hơn 0"),
    deposit: z
      .number({
        required_error: "Vui lòng nhập số tiền đặt cọc",
      })
      .min(0, "Tiền đặt cọc không thể âm"),
    paymentDueDate: z
      .number({
        required_error: "Vui lòng chọn ngày thanh toán hàng tháng",
      })
      .min(1, "Ngày thanh toán phải từ 1-31")
      .max(31, "Ngày thanh toán phải từ 1-31"),
    terms: z.record(z.any()).optional(),
  })
  .superRefine((data, ctx) => {
    // Kiểm tra endDate > startDate
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngày kết thúc phải sau ngày bắt đầu",
        path: ["endDate"],
      });
    }
  });

export type CreateContractFormValues = z.infer<typeof createContractSchema>;

// Schema cho việc ký hợp đồng
export const signContractSchema = z.object({
  signature: z
    .string({
      required_error: "Vui lòng ký tên",
    })
    .min(1, "Chữ ký không được để trống"),
});

export type SignContractFormValues = z.infer<typeof signContractSchema>;

// Schema cho việc lọc hợp đồng
export const contractFilterSchema = z.object({
  status: z.nativeEnum(ContractStatus).optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
});

export type ContractFilterValues = z.infer<typeof contractFilterSchema>;

// Schema cho file đính kèm
export const contractAttachmentSchema = z.object({
  file: z
    .instanceof(File, {
      message: "Vui lòng chọn file",
    })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File không được vượt quá 10MB"
    ),
});

export type ContractAttachmentValues = z.infer<typeof contractAttachmentSchema>;
