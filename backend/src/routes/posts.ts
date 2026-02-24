/// <reference path="../types/express.d.ts" />
import { Router, Response, Request } from "express";
import { Types } from "mongoose";
import { Post, User } from "../models";
import { upload } from "../middleware/multer";
import fs from "fs";
import path from "path";
import { authenticateToken } from "../middleware/authMiddleware";
import { log } from 'console';

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 example: "This is my new post"
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get paginated feed of posts
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of posts to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of posts to skip
 *     responses:
 *       200:
 *         description: Posts feed
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post details
 *       404:
 *         description: Post not found
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       403:
 *         description: Not post owner
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not post owner
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Get all posts by a user
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: User's posts
 */

const router = Router();

/**
 * POST /api/posts
 * Create a new post with optional image
 */
router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  async (req: Request, res: Response) => {
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
  },
);

/**
 * GET /api/posts
 * Get paginated feed of posts
 */
router.get("/", authenticateToken, async (req: Request, res: Response) => {
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

    res.json({
      posts,
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
});

/**
 * GET /api/posts/user/:userId
 * Get all posts by a specific user
 */
router.get(
  "/user/:userId",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = Array.isArray(req.params.userId)
        ? req.params.userId[0]
        : req.params.userId;

      // Validate ObjectId
      if (!Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
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

      res.json({
        posts,
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
  },
);

/**
 * GET /api/posts/:id
 * Get a single post by ID
 */
router.get("/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const post = await Post.findById(id).populate(
      "authorId",
      "username profilePicUrl",
    );

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});

/**
 * PUT /api/posts/:id
 * Update a post (owner only)
 */
router.put(
  "/:id",
  upload.single("image"),
  async (req: Request, res: Response) => {
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
      );

      res.json({
        message: "Post updated successfully",
        post: updatedPost,
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
  },
);

/**
 * DELETE /api/posts/:id
 * Delete a post (owner only)
 */
router.delete(
  "/:id",
  authenticateToken,
  async (req: Request, res: Response) => {
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
  },
);

export default router;
