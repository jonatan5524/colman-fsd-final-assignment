import api from './api';

export interface Post {
	_id: string;
	authorId: {
		_id: string;
		username: string;
		profilePicUrl?: string;
	};
	content: string;
	imageUrl?: string;
	likes: string[];
	comments: string[];
	createdAt: string;
	updatedAt: string;
}

export interface CreatePostData {
	content: string;
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
	meta?: {
		originalQuery: string;
		searchTerms: string;
		isAiEnhanced: boolean;
		count: number;
	};
}

export const postsService = {
	// Create a new post
	async createPost(data: CreatePostData): Promise<Post> {
		const formData = new FormData();
		formData.append('content', data.content);
		if (data.image) {
			formData.append('image', data.image);
		}

		const response = await api.post<{ post: Post }>('/posts', formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data.post;
	},

	// Get paginated feed
	async getFeed(limit: number = 10, skip: number = 0): Promise<FeedResponse> {
		const response = await api.get<FeedResponse>('/posts', {
			params: { limit, skip },
		});
		return response.data;
	},

	// Get posts by user
	async getPostsByUser(userId: string, limit: number = 10, skip: number = 0): Promise<FeedResponse> {
		const response = await api.get<FeedResponse>(`/posts/user/${userId}`, {
			params: { limit, skip },
		});
		return response.data;
	},

	// Get my posts
	async getMyPosts(limit: number = 10, skip: number = 0): Promise<FeedResponse> {
		const response = await api.get<FeedResponse>('/posts/me/posts', {
			params: { limit, skip },
		});
		return response.data;
	},

	// Get single post
	async getPost(postId: string): Promise<Post> {
		const response = await api.get<Post>(`/posts/${postId}`);
		return response.data;
	},

	// Update post
	async updatePost(postId: string, data: Partial<CreatePostData>): Promise<Post> {
		const formData = new FormData();
		if (data.content) {
			formData.append('content', data.content);
		}
		if (data.image) {
			formData.append('image', data.image);
		}

		const response = await api.put<{ post: Post }>(`/posts/${postId}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
		});
		return response.data.post;
	},

	// Delete post
	async deletePost(postId: string): Promise<void> {
		await api.delete(`/posts/${postId}`);
	},

	// Search posts
	async searchPosts(query: string): Promise<FeedResponse> {
		const response = await api.get<{ posts: Post[], meta: any }>('/posts/search', {
			params: { q: query },
		});
		return {
			posts: response.data.posts,
			pagination: {
				limit: response.data.posts.length,
				skip: 0,
				total: response.data.posts.length,
				hasMore: false,
			},
			meta: response.data.meta
		};
	},
};

export default postsService;
