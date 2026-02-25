import api from "./api";

export interface Comment {
	_id: string;
	postId: string;
	authorId: {
		_id: string;
		username: string;
		profilePicUrl?: string;
	};
	content: string;
	createdAt: string;
	updatedAt: string;
}

export const commentsService = {
	async getComments(postId: string): Promise<Comment[]> {
		const response = await api.get<{ comments: Comment[] }>(
			`/posts/${postId}/comments`,
		);
		return response.data.comments;
	},

	async addComment(postId: string, content: string): Promise<Comment> {
		const response = await api.post<{ comment: Comment }>(
			`/posts/${postId}/comments`,
			{ content },
		);
		return response.data.comment;
	},

	async deleteComment(commentId: string): Promise<void> {
		await api.delete(`/comments/${commentId}`);
	},
};

export default commentsService;

