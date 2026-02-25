import { Request, Response } from "express";
import { Types } from "mongoose";
import Comment from "../models/Comment";
import Post from "../models/Post";

export const createComment = async (req: Request, res: Response) => {
  try {
    const rawPostId = Array.isArray(req.params.postId)
      ? req.params.postId[0]
      : req.params.postId;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!rawPostId || !Types.ObjectId.isValid(rawPostId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return res.status(400).json({ error: "Content is required" });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > 1000) {
      return res
        .status(400)
        .json({ error: "Content must not exceed 1000 characters" });
    }

    const post = await Post.findById(rawPostId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comment = new Comment({
      postId: post._id,
      authorId: userId,
      content: trimmedContent,
    });

    await comment.save();

    // Keep Post.comments in sync
    await Post.findByIdAndUpdate(post._id, {
      $push: { comments: comment._id },
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "authorId",
      "username profilePicUrl",
    );

    return res.status(201).json({
      message: "Comment created successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({ error: "Failed to create comment" });
  }
};

export const getCommentsByPost = async (req: Request, res: Response) => {
  try {
    const rawPostId = Array.isArray(req.params.postId)
      ? req.params.postId[0]
      : req.params.postId;

    if (!rawPostId || !Types.ObjectId.isValid(rawPostId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const post = await Post.findById(rawPostId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await Comment.find({ postId: post._id })
      .sort({ createdAt: 1 })
      .populate("authorId", "username profilePicUrl")
      .lean();

    return res.status(200).json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const rawCommentId = Array.isArray(req.params.commentId)
      ? req.params.commentId[0]
      : req.params.commentId;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!rawCommentId || !Types.ObjectId.isValid(rawCommentId)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    const comment = await Comment.findById(rawCommentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.authorId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "You can only delete your own comments" });
    }

    await Comment.findByIdAndDelete(comment._id);

    // Remove comment reference from post
    await Post.findByIdAndUpdate(comment.postId, {
      $pull: { comments: comment._id },
    });

    return res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ error: "Failed to delete comment" });
  }
};

