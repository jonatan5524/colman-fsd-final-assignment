import { Router } from "express";
import { analyzeText } from "../controllers/aiController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

/**
 * @swagger
 * /api/ai/analyze:
 *   post:
 *     summary: Analyze text content
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       200:
 *         description: Analysis result
 *       400:
 *         description: Invalid input
 *       429:
 *         description: Quota exceeded
 *       503:
 *         description: AI service unavailable
 *       500:
 *         description: Internal server error
 */
router.post("/analyze", authenticateToken, analyzeText);

export default router;