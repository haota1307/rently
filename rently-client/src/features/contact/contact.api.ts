import http from "@/lib/http";
import {
  ContactFormType,
  SendUserEmailType,
  SendUserEmailSchema,
  SendBulkEmailSchema,
} from "@/schemas/contact.schema";
import { MessageResType } from "@/types/message.type";
import { PaginationParams } from "@/types/pagination.type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export interface Contact {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  subject: string;
  message: string;
  status: "PENDING" | "RESPONDED" | "CLOSED";
  response: string | null;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  respondedBy?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface ContactsResponse {
  data: Contact[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactFilters extends PaginationParams {
  status?: "PENDING" | "RESPONDED" | "CLOSED";
  search?: string;
}

const contactApiRequest = {
  // Submit a new contact form (public API)
  submitContactForm: (body: ContactFormType) =>
    http.post<MessageResType>("/contact", body),

  // Get all contacts with pagination and filters
  getContacts: (filters?: ContactFilters) => {
    const searchParams = new URLSearchParams();
    if (filters?.page) searchParams.append("page", filters.page.toString());
    if (filters?.limit) searchParams.append("limit", filters.limit.toString());
    if (filters?.status) searchParams.append("status", filters.status);
    if (filters?.search) searchParams.append("search", filters.search);

    const queryString = searchParams.toString();
    const url = queryString ? `/contact?${queryString}` : "/contact";

    return http.get<ContactsResponse>(url);
  },

  // Get a single contact by ID
  getContact: (id: number) => http.get<Contact>(`/contact/${id}`),

  // Respond to a contact
  respondToContact: (id: number, response: string) =>
    http.put<Contact>(`/contact/${id}/respond`, { response }),

  // Close a contact
  closeContact: (id: number) => http.put<Contact>(`/contact/${id}/close`, {}),

  // Admin send email directly to user
  sendUserEmail: (userId: number, body: SendUserEmailType) =>
    http.post<MessageResType>(`/contact/send-user-email/${userId}`, body),

  // Send bulk email
  sendBulkEmail: (body: z.infer<typeof SendBulkEmailSchema>) =>
    http.post<{ message: string; jobId: string; estimatedRecipients: number }>(
      "/contact/send-bulk-email",
      body
    ),

  // Get bulk email job status
  getBulkEmailStatus: (jobId: string) =>
    http.get<{ message: string }>(`/contact/bulk-email-status/${jobId}`),
};

// Custom hook for sending email to user
export const useSendUserEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: number;
      data: z.infer<typeof SendUserEmailSchema>;
    }) => contactApiRequest.sendUserEmail(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};

// Custom hook for sending bulk email
export const useSendBulkEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: z.infer<typeof SendBulkEmailSchema>) =>
      contactApiRequest.sendBulkEmail(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
};

// Custom hook for getting bulk email status
export const useGetBulkEmailStatus = (
  jobId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ["bulk-email-status", jobId],
    queryFn: () => contactApiRequest.getBulkEmailStatus(jobId),
    enabled: enabled && !!jobId,
    refetchInterval: 2000, // Refetch every 2 seconds to track progress
  });
};

export default contactApiRequest;
