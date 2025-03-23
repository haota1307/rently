import http from "@/lib/http";
import { UploadMediaResType } from "@/schemas/media.schema";

const prefix = "/upload";

const mediaApiRequest = {
  uploadImage: (formData: FormData) =>
    http.post<UploadMediaResType>(`${prefix}/image`, formData),

  uploadImages: (formData: FormData) =>
    http.post<UploadMediaResType[]>(`${prefix}/images`, formData),

  uploadVideo: (formData: FormData) =>
    http.post<UploadMediaResType>(`${prefix}/video`, formData),
};

export default mediaApiRequest;
