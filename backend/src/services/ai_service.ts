import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

let model: GenerativeModel | null = null;

export interface AnalysisResult {
	summary: string;
	tags: string[];
	sentiment: string;
}

export const analyzeContent = async (text: string): Promise<AnalysisResult> => {
	if (!model) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (apiKey) {
			const genAI = new GoogleGenerativeAI(apiKey);
			model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
		}
	}

	if (!model) {
		const err: any = new Error("AI service is not configured. Missing GEMINI_API_KEY.");
		err.status = 503; // Service Unavailable
		throw err;
	}

	const prompt = `Analyze the following text and return a JSON object with the following fields:
- summary: A one-sentence summary of the text.
- tags: An array of 3-5 relevant keywords.
- sentiment: A string (Positive, Neutral, Negative).

Text: ${text}`;

	try {
		const result = await model.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
			generationConfig: { responseMimeType: "application/json" },
		});
		const response = await result.response;
		return JSON.parse(response.text());
	} catch (error) {
		console.error("Error analyzing content with Gemini API:", error);
		throw error;
	}
};
