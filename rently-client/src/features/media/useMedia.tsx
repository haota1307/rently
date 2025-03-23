import mediaApiRequest from "@/features/media/media.api";
import { useMutation } from "@tanstack/react-query";
import { console } from "inspector";

export const useUploadImage = () => {
  return useMutation({
    mutationFn: mediaApiRequest.uploadImage,
  });
};

export const useUploadImages = () => {
  return useMutation({
    mutationFn: mediaApiRequest.uploadImages,
  });
};

export const useUploadVideo = () => {
  return useMutation({
    mutationFn: mediaApiRequest.uploadVideo,
  });
};
