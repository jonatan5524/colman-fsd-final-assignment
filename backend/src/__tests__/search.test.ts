import request from "supertest";
import express from "express";
import { Types } from "mongoose";
import postsRouter from "../../src/routes/posts";
import * as PostModel from "../../src/models/Post";
import * as aiService from "../../src/services/ai_service";

jest.mock("../../src/models/Post");
jest.mock("../../src/services/ai_service");
jest.mock("../../src/utils/tokenUtils", () => ({
	verifyAccessToken: jest.fn().mockImplementation(() => {
		return { userId: new Types.ObjectId().toString() };
	}),
}));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/posts", (req, res, next) => {
	// Mock authenticateToken middleware explicitly
	req.user = { userId: new Types.ObjectId().toString() };
	next();
}, postsRouter);

describe("Search API", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("GET /api/posts/search", () => {
		it("should return 400 when query is empty", async () => {
			const response = await request(app)
				.get("/api/posts/search?q=")
				.set("Authorization", "Bearer mock-token");

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error", "Search query cannot be empty");
		});

		it("should return 400 when query is too long", async () => {
			const longQuery = "a".repeat(201);
			const response = await request(app)
				.get(`/api/posts/search?q=${longQuery}`)
				.set("Authorization", "Bearer mock-token");

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty("error", "Search query must not exceed 200 characters");
		});

		it("should extract keywords via AI and search DB", async () => {
			const mockKeywords = "dessert cake chocolate";
			(aiService.extractKeywords as jest.Mock).mockResolvedValue(mockKeywords);

			const mockPosts = [
				{ _id: new Types.ObjectId(), content: "I love chocolate cake", score: 1.5 },
			];

			const mockFind = jest.fn().mockReturnValue({
				sort: jest.fn().mockReturnValue({
					limit: jest.fn().mockReturnValue({
						populate: jest.fn().mockReturnValue({
							lean: jest.fn().mockResolvedValue(mockPosts),
						}),
					}),
				}),
			});
			(PostModel.default.find as jest.Mock) = mockFind;

			const response = await request(app)
				.get("/api/posts/search?q=something sweet")
				.set("Authorization", "Bearer mock-token");

			expect(response.status).toBe(200);
			expect(aiService.extractKeywords).toHaveBeenCalledWith("something sweet");
			expect(PostModel.default.find).toHaveBeenCalledWith(
				{ $text: { $search: mockKeywords } },
				{ score: { $meta: "textScore" } }
			);
			expect(response.body.meta.isAiEnhanced).toBe(true);
			expect(response.body.posts).toHaveLength(1);
		});

		it("should fallback to original query if AI fails", async () => {
			(aiService.extractKeywords as jest.Mock).mockRejectedValue(new Error("AI Failed"));

			const mockPosts = [
				{ _id: new Types.ObjectId(), content: "something sweet to eat", score: 1.0 },
			];

			const mockFind = jest.fn().mockReturnValue({
				sort: jest.fn().mockReturnValue({
					limit: jest.fn().mockReturnValue({
						populate: jest.fn().mockReturnValue({
							lean: jest.fn().mockResolvedValue(mockPosts),
						}),
					}),
				}),
			});
			(PostModel.default.find as jest.Mock) = mockFind;

			const response = await request(app)
				.get("/api/posts/search?q=something sweet")
				.set("Authorization", "Bearer mock-token");

			expect(response.status).toBe(200);
			expect(PostModel.default.find).toHaveBeenCalledWith(
				{ $text: { $search: "something sweet" } },
				{ score: { $meta: "textScore" } }
			);
			expect(response.body.meta.isAiEnhanced).toBe(false);
		});
	});
});
