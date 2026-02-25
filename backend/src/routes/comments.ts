/// <reference path="../types/express.d.ts" />
import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as commentsController from "../controllers/commentsController";

const router = Router();

/**
 * @swagger
 * /api/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (author only)
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       400:
 *         description: Invalid comment ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not comment author
 *       404:
 *         description: Comment not found
 */
router.delete(
  "/:commentId",
  authenticateToken,
  commentsController.deleteComment,
);

export default router;

