import request from "supertest";
import express from "express";
import { Types } from "mongoose";
import postsRouter from "../../src/routes/posts";
import commentsRouter from "../../src/routes/comments";
import * as PostModel from "../../src/models/Post";
import * as CommentModel from "../../src/models/Comment";

// Mock dependencies
jest.mock("../../src/models/Post");
jest.mock("../../src/models/Comment");

// Mock auth middleware so all requests are treated as authenticated
jest.mock("../../src/middleware/authMiddleware", () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { userId: mockUserId };
    next();
  },
}));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);

const mockUserId = new Types.ObjectId().toString();

describe("Comments API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/posts/:postId/comments - Create Comment", () => {
    it("should create a comment on a post", async () => {
      const postId = new Types.ObjectId();

      const mockPost = {
        _id: postId,
      };

      const savedCommentId = new Types.ObjectId();
      const mockCommentInstance: any = {
        _id: savedCommentId,
        postId,
        authorId: mockUserId,
        content: "Nice post!",
        save: jest.fn().mockResolvedValue(undefined),
      };

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockPost);

      (PostModel.default.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);

      (CommentModel.default as unknown as jest.Mock).mockImplementation(
        () => mockCommentInstance,
      );

      (CommentModel.default.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: savedCommentId,
            postId,
            authorId: {
              _id: mockUserId,
              username: "testuser",
              profilePicUrl: undefined,
            },
            content: "Nice post!",
          }),
        });

      const response = await request(app)
        .post(`/api/posts/${postId.toString()}/comments`)
        .send({ content: "Nice post!" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Comment created successfully",
      );
      expect(response.body).toHaveProperty("comment");
      expect(mockCommentInstance.save).toHaveBeenCalled();
      expect(PostModel.default.findByIdAndUpdate).toHaveBeenCalledWith(
        postId,
        { $push: { comments: savedCommentId } },
      );
    });

    it("should return 400 for invalid post ID", async () => {
      const response = await request(app)
        .post("/api/posts/invalid-id/comments")
        .send({ content: "Test" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 400 when content is empty", async () => {
      const postId = new Types.ObjectId();

      const response = await request(app)
        .post(`/api/posts/${postId.toString()}/comments`)
        .send({ content: "   " });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Content is required");
    });

    it("should return 404 when post is not found", async () => {
      const postId = new Types.ObjectId();

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/posts/${postId.toString()}/comments`)
        .send({ content: "Nice post!" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Post not found");
    });
  });

  describe("GET /api/posts/:postId/comments - Get Comments for Post", () => {
    it("should return comments for a post", async () => {
      const postId = new Types.ObjectId();

      const mockPost = { _id: postId };
      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockPost);

      const mockComments = [
        {
          _id: new Types.ObjectId(),
          postId,
          authorId: { _id: mockUserId, username: "testuser" },
          content: "First comment",
          createdAt: new Date(),
        },
      ];

      (CommentModel.default.find as jest.Mock) = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockComments),
          }),
        }),
      });

      const response = await request(app).get(
        `/api/posts/${postId.toString()}/comments`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("comments");
      expect(response.body.comments).toHaveLength(1);
      expect(response.body.comments[0].content).toBe("First comment");
    });

    it("should return 400 for invalid post ID", async () => {
      const response = await request(app).get(
        "/api/posts/invalid-id/comments",
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when post is not found", async () => {
      const postId = new Types.ObjectId();

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const response = await request(app).get(
        `/api/posts/${postId.toString()}/comments`,
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Post not found");
    });
  });

  describe("DELETE /api/comments/:commentId - Delete Comment", () => {
    it("should delete own comment and remove from post", async () => {
      const commentId = new Types.ObjectId();
      const postId = new Types.ObjectId();

      const mockComment = {
        _id: commentId,
        postId,
        authorId: {
          toString: () => mockUserId,
        },
      };

      (CommentModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockComment);

      (CommentModel.default.findByIdAndDelete as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockComment);

      (PostModel.default.findByIdAndUpdate as jest.Mock) = jest
        .fn()
        .mockResolvedValue(undefined);

      const response = await request(app).delete(
        `/api/comments/${commentId.toString()}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Comment deleted successfully",
      );
      expect(PostModel.default.findByIdAndUpdate).toHaveBeenCalledWith(
        postId,
        { $pull: { comments: commentId } },
      );
    });

    it("should return 400 for invalid comment ID", async () => {
      const response = await request(app).delete("/api/comments/invalid-id");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("should return 404 when comment is not found", async () => {
      const commentId = new Types.ObjectId();

      (CommentModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const response = await request(app).delete(
        `/api/comments/${commentId.toString()}`,
      );

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Comment not found");
    });

    it("should return 403 when deleting someone else's comment", async () => {
      const commentId = new Types.ObjectId();
      const postId = new Types.ObjectId();
      const otherUserId = new Types.ObjectId().toString();

      const mockComment = {
        _id: commentId,
        postId,
        authorId: {
          toString: () => otherUserId,
        },
      };

      (CommentModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockComment);

      const response = await request(app).delete(
        `/api/comments/${commentId.toString()}`,
      );

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty(
        "error",
        "You can only delete your own comments",
      );
    });
  });
});
