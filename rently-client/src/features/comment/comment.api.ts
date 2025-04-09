import http from "@/lib/http";

export interface CommentResponse {
  data: Comment[];
  totalItems: number;
  totalPages: number;
}

export interface User {
  id: number;
  name: string;
  avatar: string | null;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  postId: number;
  parentId: number | null;
  user: User;
  replies?: Comment[];
}

const commentApiRequest = {
  getComments: async (params: {
    postId: number;
    page?: number;
    limit?: number;
  }) => {
    const { postId, page = 1, limit = 10 } = params;
    return await http.get<CommentResponse>(
      `comments?postId=${postId}&page=${page}&limit=${limit}`
    );
  },

  getReplies: async (params: {
    parentId: number;
    page?: number;
    limit?: number;
  }) => {
    const { parentId, page = 1, limit = 10 } = params;
    return await http.get<CommentResponse>(
      `comments/replies?parentId=${parentId}&page=${page}&limit=${limit}`
    );
  },

  createComment: async (data: {
    content: string;
    postId: number;
    parentId?: number;
  }) => {
    return await http.post<Comment>("comments", data);
  },

  updateComment: async (commentId: number, data: { content: string }) => {
    return await http.put<Comment>(`comments/${commentId}`, data);
  },

  deleteComment: async (commentId: number) => {
    return await http.delete(`comments/${commentId}`);
  },

  getCommentById: async (commentId: number) => {
    return await http.get<Comment>(`comments/${commentId}`);
  },
};

export default commentApiRequest;
