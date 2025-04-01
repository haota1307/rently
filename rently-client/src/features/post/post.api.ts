// rently-client/src/features/post/post.api.ts
import http from "@/lib/http";
import {
  CreatePostBodyType,
  GetPostsQueryType,
  UpdatePostBodyType,
} from "@/schemas/post.schema";
import queryString from "query-string";

const prefix = "/posts"; // Đã chỉnh từ /rental-posts thành /posts theo controller

const postApiRequest = {
  list: (params: GetPostsQueryType) =>
    http.get(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
          title: params.title,
          status: params.status,
          startDate: params.startDate,
          endDate: params.endDate,
        })
    ),

  // Nếu có API riêng cho "my posts", cần thêm vào service ở phía server
  listMyPosts: (params: GetPostsQueryType) =>
    http.get(
      `${prefix}/my?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
        })
    ),

  detail: (postId: number) => http.get(`${prefix}/${postId}`),

  create: (body: CreatePostBodyType) => http.post(`${prefix}`, body),

  update: (postId: number, body: UpdatePostBodyType) =>
    http.put(`${prefix}/${postId}`, body),

  delete: (postId: number) => http.delete(`${prefix}/${postId}`),
};

export default postApiRequest;
