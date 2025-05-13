import http from "@/lib/http";
import { UploadMediaResType } from "@/schemas/media.schema";

const prefix = "/upload";

const mediaApiRequest = {
  uploadImage: (formData: FormData) =>
    http.post<{ url: string; public_id: string }>(`${prefix}/image`, formData),

  uploadImages: (formData: FormData) =>
    http.post<{ url: string; public_id: string }[]>(
      `${prefix}/images`,
      formData
    ),

  uploadVideo: (formData: FormData) =>
    http.post<{ url: string; public_id: string }>(`${prefix}/video`, formData),
};

export default mediaApiRequest;
