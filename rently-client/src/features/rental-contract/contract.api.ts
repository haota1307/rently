import http from "@/lib/http";
import { ContractStatus } from "./contract.constants";
import queryString from "query-string";
import { getAccessTokenFromLocalStorage } from "@/lib/auth-utils";

const prefix = "/rental-contracts";

type ContractQueryParams = {
  page?: number;
  limit?: number;
  status?: ContractStatus;
  search?: string;
};

type ContractAttachment = {
  id: number;
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadedBy: number;
  createdAt: Date;
};

type ContractDetailType = {
  id: number;
  contractNumber: string;
  rentalRequestId: number;
  roomId: number;
  landlordId: number;
  tenantId: number;
  startDate: Date;
  endDate: Date;
  monthlyRent: number;
  deposit: number;
  paymentDueDate: number;
  contractContent: string;
  terms: Record<string, any> | null;
  landlordSignedAt: Date | null;
  tenantSignedAt: Date | null;
  status: ContractStatus;
  createdAt: Date;
  updatedAt: Date;
  finalDocumentUrl: string | null;
  landlord: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  tenant: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  room: {
    id: number;
    title: string;
    price: number;
    area: number;
  };
  rentalRequest: {
    id: number;
    postId: number;
    status: string;
  };
  attachments: ContractAttachment[];
  template: {
    id: number;
    name: string;
    fileUrl: string;
  } | null;
};

type ContractsListResponseType = {
  data: ContractDetailType[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
};

type CreateContractType = {
  rentalRequestId: number;
  templateId?: number;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  paymentDueDate: number;
  terms?: Record<string, any>;
};

type SignContractType = {
  signature: string; // Base64 encoded signature image
};

export const contractApiRequest = {
  /**
   * Lấy danh sách hợp đồng (có thể lọc theo trạng thái)
   */
  list: (params: ContractQueryParams = {}) =>
    http.get<ContractsListResponseType>(
      `${prefix}?${queryString.stringify(params)}`
    ),

  /**
   * Lấy chi tiết hợp đồng theo ID
   */
  detail: (id: number) => http.get<ContractDetailType>(`${prefix}/${id}`),

  /**
   * Tạo hợp đồng mới
   */
  create: (data: CreateContractType) =>
    http.post<ContractDetailType>(prefix, data),

  /**
   * Ký hợp đồng (chủ nhà hoặc người thuê)
   */
  sign: (id: number, data: SignContractType) =>
    http.post<ContractDetailType>(`${prefix}/${id}/sign`, data),

  /**
   * Thêm tệp đính kèm vào hợp đồng
   * @param id ID của hợp đồng
   * @param file File cần đính kèm
   */
  addAttachment: (id: number, file: File) => {
    // Kiểm tra môi trường trước khi sử dụng File
    if (typeof window === "undefined") {
      throw new Error("Phương thức này chỉ có thể được gọi ở phía client");
    }

    const formData = new FormData();
    formData.append("file", file);
    return http.post<ContractDetailType>(
      `${prefix}/${id}/attachments`,
      formData
    );
  },

  /**
   * Tải xuống tài liệu hợp đồng cuối cùng dưới dạng PDF
   * Trả về Blob để tạo URL tải xuống
   */
  downloadFinalDocument: async (id: number) => {
    // Kiểm tra môi trường trước khi sử dụng XMLHttpRequest
    if (typeof window === "undefined") {
      throw new Error("Phương thức này chỉ có thể được gọi ở phía client");
    }

    // Sử dụng XMLHttpRequest để lấy blob trực tiếp
    return new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "GET",
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/${prefix.replace(/^\//, "")}/${id}/final-document`
      );
      xhr.responseType = "blob";

      // Thêm token xác thực
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      }

      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error("Không thể tải file hợp đồng"));
        }
      };

      xhr.onerror = function () {
        reject(new Error("Lỗi mạng khi tải hợp đồng"));
      };

      xhr.send();
    });
  },

  /**
   * Lấy các mẫu hợp đồng có sẵn
   */
  templates: (
    params: { page?: number; limit?: number; search?: string } = {}
  ) => {
    const queryStr = queryString.stringify(params);
    return http.get(`${prefix}/templates${queryStr ? `?${queryStr}` : ""}`);
  },

  /**
   * Lấy chi tiết mẫu hợp đồng
   */
  templateDetail: (id: number) => http.get(`${prefix}/templates/${id}`),

  /**
   * Xuất hợp đồng dạng PDF
   * Trả về Blob để tạo URL tải xuống
   * @param id ID của hợp đồng
   */
  exportPDF: async (id: number): Promise<Blob> => {
    // Kiểm tra môi trường trước khi sử dụng XMLHttpRequest
    if (typeof window === "undefined") {
      throw new Error("Phương thức này chỉ có thể được gọi ở phía client");
    }

    try {
      // Sử dụng XMLHttpRequest để lấy blob trực tiếp
      return new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(
          "GET",
          `${process.env.NEXT_PUBLIC_API_ENDPOINT}/${prefix.replace(/^\//, "")}/${id}/export-pdf`
        );
        xhr.responseType = "blob";

        // Thêm token xác thực
        const accessToken = getAccessTokenFromLocalStorage();
        if (accessToken) {
          xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        }

        xhr.onload = function () {
          if (this.status >= 200 && this.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error("Không thể tải file hợp đồng"));
          }
        };

        xhr.onerror = function () {
          reject(new Error("Lỗi mạng khi tải hợp đồng"));
        };

        xhr.send();
      });
    } catch (error) {
      console.error("Lỗi khi xuất PDF:", error);
      throw error;
    }
  },
};

export default contractApiRequest;
