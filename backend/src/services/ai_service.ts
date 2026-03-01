import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import fs from "fs";
import { LLMUnavailableError, LLMServiceError } from "../types/errors";

let model: GenerativeModel | null = null;

export interface AnalysisResult {
	summary: string;
	tags: string[];
	sentiment: string;
}

const getModel = (): GenerativeModel => {
	if (!model) {
		const apiKey = process.env.GEMINI_API_KEY;
		if (apiKey) {
			const genAI = new GoogleGenerativeAI(apiKey);
			model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
		}
	}

	if (!model) {
		throw new LLMUnavailableError();
	}

	return model;
};

export const analyzeContent = async (text: string): Promise<AnalysisResult> => {
	const activeModel = getModel();

	const prompt = `Analyze the following text and return a JSON object with the following fields:
- summary: A one-sentence summary of the text.
- tags: An array of 3-5 relevant keywords.
- sentiment: A string (Positive, Neutral, Negative).

Text: ${text}`;

	try {
		const result = await activeModel.generateContent({
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

export const extractKeywords = async (userQuery: string): Promise<string> => {
	const activeModel = getModel();

	const prompt = `You are an expert search query analyzer and keyword extractor for a social network.

Input Query: "${userQuery}"

Response Format:
Return ONLY a space-separated string of keywords.

Rules:
1. Extract the core meaning of the query and expand it with 5-10 highly relevant synonyms or related terms.
2. Remove stop words, filler words, and punctuation.
3. If the query is complete nonsense, unrelated to normal topics, or cannot be analyzed, simply return the original query words and nothing else.
4. Output must be exactly a single line of space-separated words.
5. Do not provide any conversational text, explanations, or formatting (no quotes, no markdown).

Examples:
Input: "Where can I eat vegan food?"
Output: vegan restaurant vegetable healthy plant-based food salad

Input: "I want something sweet"
Output: dessert cake chocolate candy sweet pastry sugar

Input: "asdfasdf"
Output: asdfasdf`;

	try {
		const result = await activeModel.generateContent({
			contents: [{ role: "user", parts: [{ text: prompt }] }],
		});
		const response = await result.response;
		return response.text().trim();
	} catch (error: unknown) {
		console.error("Error extracting keywords with Gemini API:", error);
		throw new LLMServiceError("Failed to extract keywords");
	}
};

export const analyzeImage = async (imagePath: string): Promise<string> => {
	const activeModel = getModel();

	try {
		const mimeType = imagePath.toLowerCase().endsWith("png") ? "image/png" :
			imagePath.toLowerCase().endsWith("webp") ? "image/webp" : "image/jpeg";

		const imageParts = [
			{
				inlineData: {
					data: Buffer.from(fs.readFileSync(imagePath)).toString("base64"),
					mimeType
				},
			},
		];

		const prompt = `You are an expert image analyzer for a social network.

Instruction: Analyze the provided image and extract its main subjects, themes, and objects.

Response Format:
Return ONLY a space-separated string of keywords.

Rules:
1. Extract 5-10 highly relevant descriptive keywords.
2. Focus on the main subjects, actions, colors, and setting.
3. Remove stop words, filler words, and punctuation.
4. Output must be exactly a single line of space-separated words.
5. Do not provide any conversational text, explanations, or formatting (no quotes, no markdown).
6. If the image is entirely blank, unrecognizable, or purely text, return general descriptive words like "blank", "unclear", or "text".

Examples (conceptual):
(Image of a dog catching a frisbee in a park) -> dog frisbee catching park grass playing animal outdoor
(Image of a sunset over the ocean) -> sunset ocean sea water sun sky evening orange beautiful
(Image of a delicious looking pizza) -> pizza food cheese crust pepperoni cooking meal italian`;

		const result = await activeModel.generateContent([prompt, ...imageParts]);
		const response = await result.response;
		return response.text().trim();
	} catch (error) {
		console.error("Error analyzing image with Gemini API:", error);
		return ""; // Return empty string on failure to not block post creation
	}
};
