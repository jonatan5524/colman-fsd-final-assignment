import { Request, Response } from "express";
import Post from "../models/Post";
import { extractKeywords } from "../services/ai_service";

export const searchPosts = async (req: Request, res: Response) => {
	try {
		const query = req.query.q as string;

		if (!query || query.trim().length === 0) {
			const err: any = new Error("Search query cannot be empty");
			err.status = 400;
			throw err;
		}

		if (query.length > 200) {
			const err: any = new Error("Search query must not exceed 200 characters");
			err.status = 400;
			throw err;
		}

		let searchTerms = query.trim();
		let isAiEnhanced = false;

		try {
			// Try to get AI extracted keywords
			const aiKeywords = await extractKeywords(searchTerms);
			if (aiKeywords && aiKeywords.length > 0) {
				searchTerms = aiKeywords;
				isAiEnhanced = true;
			}
		} catch (error) {
			console.error("Failed to extract keywords, falling back to original query", error);
			// Continue with original query as fallback
		}

		// Limit to 50 results maximum
		const posts = await Post.find(
			{ $text: { $search: searchTerms } },
			{ score: { $meta: "textScore" } }
		)
			.sort({ score: { $meta: "textScore" } })
			.limit(50)
			.populate("authorId", "username profilePicUrl")
			.lean();

		res.json({
			posts,
			meta: {
				originalQuery: query.trim(),
				searchTerms,
				isAiEnhanced,
				count: posts.length
			}
		});

	} catch (error: any) {
		console.error("Error searching posts:", error);
		const status = error.status || 500;
		res.status(status).json({ error: error.message || "Failed to search posts" });
	}
};
