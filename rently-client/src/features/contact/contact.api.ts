import http from "@/lib/http";
import { ContactFormType } from "@/schemas/contact.schema";
import { MessageResType } from "@/types/message.type";
import { PaginationParams } from "@/types/pagination.type";

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
};

export default contactApiRequest;
