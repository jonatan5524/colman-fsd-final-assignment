import axios from "axios";
import type { AxiosInstance } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export interface Post {
  _id: string;
  authorId: {
    _id: string;
    username: string;
    profilePicUrl?: string;
  };
  text: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  text: string;
  image?: File;
}

export interface FeedResponse {
  posts: Post[];
  pagination: {
    limit: number;
    skip: number;
    total: number;
    hasMore: boolean;
  };
}

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  config.headers["x-user-id"] = "mock-user-id-123";
    
  return config;
});

export const postsAPI = {
  // Create a new post
  createPost: async (data: CreatePostData): Promise<Post> => {
    const formData = new FormData();
    formData.append("text", data.text);
    if (data.image) {
      formData.append("image", data.image);
    }

    const response = await apiClient.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.post;
  },

  // Get paginated feed
  getFeed: async (
    limit: number = 10,
    skip: number = 0,
  ): Promise<FeedResponse> => {
    const response = await apiClient.get("/posts", {
      params: { limit, skip },
    });
    return response.data;
  },

  // Get posts by user
  getPostsByUser: async (
    userId: string,
    limit: number = 10,
    skip: number = 0,
  ): Promise<FeedResponse> => {
    const response = await apiClient.get(`/posts/user/${userId}`, {
      params: { limit, skip },
    });
    return response.data;
  },

  // Get single post
  getPost: async (postId: string): Promise<Post> => {
    const response = await apiClient.get(`/posts/${postId}`);
    return response.data;
  },

  // Update post
  updatePost: async (
    postId: string,
    data: Partial<CreatePostData>,
  ): Promise<Post> => {
    const formData = new FormData();
    if (data.text) {
      formData.append("text", data.text);
    }
    if (data.image) {
      formData.append("image", data.image);
    }

    const response = await apiClient.put(`/posts/${postId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.post;
  },

  // Delete post
  deletePost: async (postId: string): Promise<void> => {
    await apiClient.delete(`/posts/${postId}`);
  },
};

export default apiClient;
