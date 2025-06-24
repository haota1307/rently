import http from "@/lib/http";
import {
  CreatePostBodyType,
  CreateBulkPostsBodyType,
  CreateBulkPostsResType,
  GetNearbyPostsResType,
  GetPostsQueryType,
  GetPostsResType,
  PostType,
  UpdatePostBodyType,
  UpdatePostStatusType,
} from "@/schemas/post.schema";
import queryString from "query-string";

const prefix = "/posts";

const postApiRequest = {
  list: (params: GetPostsQueryType) =>
    http.get<GetPostsResType>(
      `${prefix}?` +
        queryString.stringify(params as any, {
          arrayFormat: "comma",
          skipNull: true,
          skipEmptyString: true,
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

  createBulk: (body: CreateBulkPostsBodyType) =>
    http.post<CreateBulkPostsResType>(`${prefix}/bulk`, body),

  update: (postId: number, body: UpdatePostBodyType) =>
    http.put<PostType>(`${prefix}/${postId}`, body),

  // Cập nhật trạng thái bài đăng
  updateStatus: (postId: number, body: UpdatePostStatusType) =>
    http.patch<{ message: string }>(`${prefix}/${postId}/status`, body),

  delete: (postId: number) =>
    http.delete<{ message: string }>(`${prefix}/${postId}`),

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

  // Lấy danh sách bài đăng gần vị trí hiện tại của người dùng
  getNearbyPosts: (params: { lat: number; lng: number; limit?: number }) =>
    http.get<GetNearbyPostsResType>(
      `${prefix}/nearby?${queryString.stringify({
        lat: params.lat,
        lng: params.lng,
        limit: params.limit || 5,
      })}`
    ),
};

export default postApiRequest;
