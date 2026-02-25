import { Request, Response } from "express";
import { analyzeContent } from "../services/ai_service";

export const analyzeText = async (req: Request, res: Response): Promise<void> => {
	const { content } = req.body;

	if (!content) {
		res.status(400).json({ message: "Content is required" });
		return;
	}

	try {
		const result = await analyzeContent(content);
		res.status(200).json(result);
	} catch (error: any) {
		console.error("AI Analysis Error:", error);
		if (error.status === 429 || error.message?.includes("quota")) {
			res.status(429).json({ message: "AI service quota exceeded or unavailable" });
			return;
		}
		if (error.status === 503) {
			res.status(503).json({ message: "AI service is currently unavailable" });
			return;
		}
		res.status(500).json({ message: "Internal server error" });
	}
};