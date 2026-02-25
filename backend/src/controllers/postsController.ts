import { Request, Response } from "express";
import Post from "../models/Post";
import User from "../models/User";
import Like from "../models/Like";

// Controller functions will be implemented here for each route

import fs from "fs";
import path from "path";
import { Types } from "mongoose";

export const createPost = async (req: Request, res: Response) => {
	try {
		const { content } = req.body;
		const userId = req.user?.userId;

		// Validate input
		if (!content || content.trim().length === 0) {
			// Clean up uploaded file if validation fails
			if (req.file) {
				fs.unlinkSync(req.file.path);
			}
			return res.status(400).json({ error: "Text content is required" });
		}

		if (content.length > 5000) {
			if (req.file) {
				fs.unlinkSync(req.file.path);
			}
			return res
				.status(400)
				.json({ error: "Content must not exceed 5000 characters" });
		}

		// Prepare image URL
		let imageUrl: string | undefined;
		if (req.file) {
			// Store relative path for serving via Express static middleware
			imageUrl = `/uploads/posts/${req.file.filename}`;
		}

		// Create post
		const post = new Post({
			authorId: userId,
			content: content.trim(),
			imageUrl,
		});

		await post.save();

		// Populate author info
		const populatedPost = await Post.findById(post._id).populate(
			"authorId",
			"username profilePicUrl",
		);

		res.status(201).json({
			message: "Post created successfully",
			post: populatedPost,
		});
	} catch (error) {
		// Clean up uploaded file on error
		if (req.file) {
			try {
				fs.unlinkSync(req.file.path);
			} catch (e) {
				console.error("Error cleaning up file:", e);
			}
		}
		console.error("Error creating post:", error);
		res.status(500).json({ error: "Failed to create post" });
	}
};

export const getPostById = async (req: Request, res: Response) => {
	try {
		const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

		if (!rawId || !Types.ObjectId.isValid(rawId)) {
			return res.status(400).json({ error: "Invalid post ID" });
		}

		const post = await Post.findById(rawId)
			.populate("authorId", "username profilePicUrl")
			.lean();

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		let isLiked = false;
		if (req.user?.userId) {
			const like = await Like.findOne({ postId: post._id, userId: req.user.userId }).lean();
			isLiked = !!like;
		}

		return res.status(200).json({ ...post, isLiked });
	} catch (error) {
		console.error("Error fetching post:", error);
		return res.status(500).json({ error: "Failed to fetch post" });
	}
};

export const getFeed = async (req: Request, res: Response) => {
	try {
		const limit = Math.min(parseInt(req.query.limit as string) || 10, 100); // Max 100 per page
		const skip = parseInt(req.query.skip as string) || 0;

		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.populate("authorId", "username profilePicUrl")
			.lean();

		const total = await Post.countDocuments();

		const userId = req.user?.userId;
		let postsWithLikes = posts.map(p => ({ ...p, isLiked: false }));

		if (userId && posts.length > 0) {
			const postIds = posts.map(p => p._id);
			const likes = await Like.find({ postId: { $in: postIds }, userId }).lean();
			const likedPostIds = new Set(likes.map(l => l.postId.toString()));
			
			postsWithLikes = posts.map(p => ({
				...p,
				isLiked: likedPostIds.has(p._id.toString()),
			}));
		}

		res.json({
			posts: postsWithLikes,
			pagination: {
				limit,
				skip,
				total,
				hasMore: skip + limit < total,
			},
		});
	} catch (error) {
		console.error("Error fetching feed:", error);
		res.status(500).json({ error: "Failed to fetch feed" });
	}
};

export const getMyPosts = async (req: Request, res: Response) => {
	try {
		const userId = req.user?.userId;
		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
		const skip = parseInt(req.query.skip as string) || 0;

		const posts = await Post.find({ authorId: userId })
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.populate("authorId", "username profilePicUrl")
			.lean();

		const total = await Post.countDocuments({ authorId: userId });

		const currentUserId = req.user?.userId;
		let postsWithLikes = posts.map(p => ({ ...p, isLiked: false }));

		if (currentUserId && posts.length > 0) {
			const postIds = posts.map(p => p._id);
			const likes = await Like.find({ postId: { $in: postIds }, userId: currentUserId }).lean();
			const likedPostIds = new Set(likes.map(l => l.postId.toString()));
			
			postsWithLikes = posts.map(p => ({
				...p,
				isLiked: likedPostIds.has(p._id.toString()),
			}));
		}

		res.json({
			posts: postsWithLikes,
			pagination: {
				limit,
				skip,
				total,
				hasMore: skip + limit < total,
			},
		});
	} catch (error) {
		console.error("Error fetching user posts:", error);
		res.status(500).json({ error: "Failed to fetch user posts" });
	}
};

export const updatePost = async (req: Request, res: Response) => {
	try {
		const id = Array.isArray(req.params.id)
			? req.params.id[0]
			: req.params.id;
		const { content } = req.body;
		const userId = req.user?.userId;

		if (!Types.ObjectId.isValid(id)) {
			if (req.file) fs.unlinkSync(req.file.path);
			return res.status(400).json({ error: "Invalid post ID" });
		}

		const post = await Post.findById(id);

		if (!post) {
			if (req.file) fs.unlinkSync(req.file.path);
			return res.status(404).json({ error: "Post not found" });
		}

		// Verify ownership
		if (post.authorId.toString() !== userId) {
			if (req.file) fs.unlinkSync(req.file.path);
			return res
				.status(403)
				.json({ error: "You can only update your own posts" });
		}

		// Validate content if provided
		if (content !== undefined) {
			if (content.trim().length === 0) {
				if (req.file) fs.unlinkSync(req.file.path);
				return res.status(400).json({ error: "Content is required" });
			}
			if (content.length > 5000) {
				if (req.file) fs.unlinkSync(req.file.path);
				return res
					.status(400)
					.json({ error: "Content must not exceed 5000 characters" });
			}
			post.content = content.trim();
		}

		// Handle image update
		if (req.file) {
			// Delete old image if exists
			if (post.imageUrl) {
				const oldImagePath = path.join(__dirname, "../../", post.imageUrl);
				try {
					if (fs.existsSync(oldImagePath)) {
						fs.unlinkSync(oldImagePath);
					}
				} catch (err) {
					console.error("Error deleting old image:", err);
				}
			}
			post.imageUrl = `/uploads/posts/${req.file.filename}`;
		}

		await post.save();

		const updatedPost = await Post.findById(post._id).populate(
			"authorId",
			"username profilePicUrl",
		).lean();

		let isLiked = false;
		if (userId && updatedPost) {
			const like = await Like.findOne({ postId: updatedPost._id, userId }).lean();
			isLiked = !!like;
		}

		res.json({
			message: "Post updated successfully",
			post: { ...updatedPost, isLiked },
		});
	} catch (error) {
		if (req.file) {
			try {
				fs.unlinkSync(req.file.path);
			} catch (e) {
				console.error("Error cleaning up file:", e);
			}
		}
		console.error("Error updating post:", error);
		res.status(500).json({ error: "Failed to update post" });
	}
};

export const deletePost = async (req: Request, res: Response) => {
	try {
		const id = Array.isArray(req.params.id)
			? req.params.id[0]
			: req.params.id;
		const userId = req.user?.userId;

		if (!Types.ObjectId.isValid(id)) {
			return res.status(400).json({ error: "Invalid post ID" });
		}

		const post = await Post.findById(id);

		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Verify ownership
		if (post.authorId.toString() !== userId) {
			return res
				.status(403)
				.json({ error: "You can only delete your own posts" });
		}

		// Delete image file if exists
		if (post.imageUrl) {
			const imagePath = path.join(__dirname, "../../", post.imageUrl);
			try {
				if (fs.existsSync(imagePath)) {
					fs.unlinkSync(imagePath);
				}
			} catch (err) {
				console.error("Error deleting image:", err);
			}
		}

		await Post.findByIdAndDelete(id);

		res.json({ message: "Post deleted successfully" });
	} catch (error) {
		console.error("Error deleting post:", error);
		res.status(500).json({ error: "Failed to delete post" });
	}
};

export const getPostsByUser = async (req: Request, res: Response) => {
	try {
		const userId = req.params.userId;
		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
		const skip = parseInt(req.query.skip as string) || 0;

		const posts = await Post.find({ authorId: userId })
			.sort({ createdAt: -1 })
			.limit(limit)
			.skip(skip)
			.populate("authorId", "username profilePicUrl")
			.lean();

		const total = await Post.countDocuments({ authorId: userId });

		const currentUserId = req.user?.userId;
		let postsWithLikes = posts.map(p => ({ ...p, isLiked: false }));

		if (currentUserId && posts.length > 0) {
			const postIds = posts.map(p => p._id);
			const likes = await Like.find({ postId: { $in: postIds }, userId: currentUserId }).lean();
			const likedPostIds = new Set(likes.map(l => l.postId.toString()));
			
			postsWithLikes = posts.map(p => ({
				...p,
				isLiked: likedPostIds.has(p._id.toString()),
			}));
		}

		res.json({
			posts: postsWithLikes,
			pagination: {
				limit,
				skip,
				total,
				hasMore: skip + limit < total,
			},
		});
	} catch (error) {
		console.error("Error fetching user posts:", error);
		res.status(500).json({ error: "Failed to fetch user posts" });
	}
};

export const toggleLikePost = async (req: Request, res: Response) => {
	try {
		const postId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		const userId = req.user?.userId;

		if (!userId) {
			return res.status(401).json({ error: "Unauthorized" });
		}

		if (!Types.ObjectId.isValid(postId)) {
			return res.status(400).json({ error: "Invalid post ID" });
		}

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		const existingLike = await Like.findOne({ postId, userId });

		if (existingLike) {
			// Unlike
			await Like.findByIdAndDelete(existingLike._id);
			post.likesCount = Math.max(0, post.likesCount - 1);
			await post.save();

			return res.json({
				isLiked: false,
				likesCount: post.likesCount,
			});
		} else {
			// Like
			await Like.create({ postId, userId });
			post.likesCount += 1;
			await post.save();

			return res.json({
				isLiked: true,
				likesCount: post.likesCount,
			});
		}
	} catch (error) {
		console.error("Error toggling like:", error);
		res.status(500).json({ error: "Failed to toggle like on post" });
	}
};
