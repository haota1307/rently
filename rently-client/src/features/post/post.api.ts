// rently-client/src/features/post/post.api.ts
import http from "@/lib/http";
import {
  CreatePostBodyType,
  GetPostsQueryType,
  GetPostsResType,
  PostType,
  UpdatePostBodyType,
} from "@/schemas/post.schema";
import queryString from "query-string";

const prefix = "/posts";

const postApiRequest = {
  list: (params: GetPostsQueryType) =>
    http.get<GetPostsResType>(
      `${prefix}?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
          title: params.title,
        })
    ),

  // Nếu có API riêng cho "my posts", cần thêm vào service ở phía server
  listMyPosts: (params: GetPostsQueryType) =>
    http.get<GetPostsResType>(
      `${prefix}/my?` +
        queryString.stringify({
          limit: params.limit,
          page: params.page,
          title: params.title,
          status: params.status,
          startDate: params.startDate,
          endDate: params.endDate,
        })
    ),

  detail: (postId: number) => http.get<PostType>(`${prefix}/${postId}`),

  create: (body: CreatePostBodyType) => http.post<PostType>(`${prefix}`, body),

  update: (postId: number, body: UpdatePostBodyType) =>
    http.put<PostType>(`${prefix}/${postId}`, body),

  delete: (postId: number) => http.delete<PostType>(`${prefix}/${postId}`),

  // Lấy danh sách phòng trọ có mức giá tương tự
  getSimilarByPrice: (postId: number, limit = 4) =>
    http.get<GetPostsResType>(
      `${prefix}/${postId}/similar-price?limit=${limit}`
    ),

  // Lấy danh sách phòng trọ cùng nhà trọ
  getSameRental: (rentalId: number, currentPostId: number, limit = 4) =>
    http.get<GetPostsResType>(
      `${prefix}/rental/${rentalId}?exclude=${currentPostId}&limit=${limit}`
    ),
};

export default postApiRequest;
