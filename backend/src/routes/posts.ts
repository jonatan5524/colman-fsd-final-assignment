/// <reference path="../types/express.d.ts" />
import { Router } from "express";
import { upload } from "../middleware/multer";
import { authenticateToken } from "../middleware/authMiddleware";
import * as postsController from "../controllers/postsController";
import * as commentsController from "../controllers/commentsController";
import * as searchController from "../controllers/searchController";

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
 *               - content
 *             properties:
 *               content:
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
  postsController.createPost
);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: Create a new comment on a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: "This is my comment"
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Invalid input or post ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.post(
  "/:postId/comments",
  authenticateToken,
  commentsController.createComment,
);

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: Get all comments for a post
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of comments
 *       400:
 *         description: Invalid post ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.get(
  "/:postId/comments",
  authenticateToken,
  commentsController.getCommentsByPost,
);

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get paginated feed of posts
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 */
router.get(
  "/",
  authenticateToken,
  postsController.getFeed
);

/**
 * @swagger
 * /api/posts/search:
 *   get:
 *     summary: Smart search for posts using AI keyword extraction
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: The free-text query to search for
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid query
 *       500:
 *         description: Internal server error
 */
router.get(
  "/search",
  authenticateToken,
  searchController.searchPosts,
);

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a single post by ID
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
 *         description: Post data
 *       400:
 *         description: Invalid post ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Post not found
 */
router.get(
  "/:id",
  authenticateToken,
  postsController.getPostById,
);

/**
 * @swagger
 * /api/posts/me/posts:
 *   get:
 *     summary: Get all posts by the current user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *         description: User's posts
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/me/posts",
  authenticateToken,
  postsController.getMyPosts
);

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: Update a post (owner only)
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
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Invalid post ID or content
 *       403:
 *         description: Not post owner
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.put(
  "/:id",
  authenticateToken,
  upload.single("image"),
  postsController.updatePost
);

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: Delete a post (owner only)
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
 *       400:
 *         description: Invalid post ID
 *       403:
 *         description: Not post owner
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/:id",
  authenticateToken,
  postsController.deletePost
);

/**
 * @swagger
 * /api/posts/user/{userId}:
 *   get:
 *     summary: Get all posts by a specific user
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
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
 *         description: Number of posts to return
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of posts to skip
 *     responses:
 *       200:
 *         description: User's posts
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Internal server error
 */
router.get(
  "/user/:userId",
  authenticateToken,
  postsController.getPostsByUser
);

export default router;
