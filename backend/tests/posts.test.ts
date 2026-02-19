import request from 'supertest';
import express from 'express';
import { Types } from 'mongoose';
import postsRouter from '../../src/routes/posts';
import * as PostModel from '../../src/models/Post';
import * as jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('../../src/models/Post');
jest.mock('jsonwebtoken');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/posts', postsRouter);

// Mock JWT token
const mockUserId = new Types.ObjectId().toString();
const mockToken = 'Bearer mock-jwt-token';

describe('Posts API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/posts - Create Post', () => {
    it('should create a post with text only', async () => {
      const mockPost = {
        _id: new Types.ObjectId(),
        authorId: mockUserId,
        text: 'Test post content',
        imageUrl: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue({
          _id: new Types.ObjectId(),
          authorId: mockUserId,
          text: 'Test post content',
          imageUrl: undefined,
        }),
      };

      (PostModel.default as jest.Mock).mockImplementation(() => mockPost);
      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockReturnValue({
          populate: jest.fn().mockResolvedValue({
            _id: mockPost._id,
            authorId: { username: 'testuser', profilePicUrl: undefined },
            text: 'Test post content',
          }),
        });

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', mockToken)
        .field('text', 'Test post content');

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Post created successfully');
    });

    it('should return 400 when text is empty', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', mockToken)
        .field('text', '');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/posts')
        .field('text', 'Test post');

      expect(response.status).toBe(401);
    });

    it('should return 400 when text exceeds max length', async () => {
      const longText = 'a'.repeat(5001);

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', mockToken)
        .field('text', longText);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/posts - Get Feed', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        {
          _id: new Types.ObjectId(),
          authorId: { username: 'user1', profilePicUrl: undefined },
          text: 'Post 1',
          createdAt: new Date(),
        },
        {
          _id: new Types.ObjectId(),
          authorId: { username: 'user2', profilePicUrl: undefined },
          text: 'Post 2',
          createdAt: new Date(),
        },
      ];

      (PostModel.default.find as jest.Mock) = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockPosts),
              }),
            }),
          }),
        }),
      });

      (PostModel.default.countDocuments as jest.Mock) = jest
        .fn()
        .mockResolvedValue(20);

      const response = await request(app).get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('hasMore');
    });

    it('should respect limit parameter', async () => {
      (PostModel.default.find as jest.Mock) = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      });

      (PostModel.default.countDocuments as jest.Mock) = jest
        .fn()
        .mockResolvedValue(0);

      const response = await request(app).get('/api/posts?limit=5&skip=10');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.skip).toBe(10);
    });
  });

  describe('GET /api/posts/user/:userId - Get User Posts', () => {
    it('should return posts for a specific user', async () => {
      const userId = new Types.ObjectId();

      (PostModel.default.find as jest.Mock) = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([
                  {
                    _id: new Types.ObjectId(),
                    authorId: { username: 'testuser' },
                    text: 'My post',
                  },
                ]),
              }),
            }),
          }),
        }),
      });

      (PostModel.default.countDocuments as jest.Mock) = jest
        .fn()
        .mockResolvedValue(1);

      const response = await request(app).get(`/api/posts/user/${userId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('posts');
    });

    it('should return 400 for invalid user ID', async () => {
      const response = await request(app).get('/api/posts/user/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/posts/:id - Update Post', () => {
    it('should update own post', async () => {
      const postId = new Types.ObjectId();

      const mockPost = {
        _id: postId,
        authorId: new Types.ObjectId(mockUserId),
        text: 'Original text',
        save: jest.fn().mockResolvedValue({
          _id: postId,
          authorId: new Types.ObjectId(mockUserId),
          text: 'Updated text',
        }),
      };

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce(mockPost)
        .mockReturnValueOnce({
          populate: jest.fn().mockResolvedValue({
            _id: postId,
            authorId: { username: 'testuser' },
            text: 'Updated text',
          }),
        });

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', mockToken)
        .field('text', 'Updated text');

      expect(response.status).toBe(200);
    });

    it('should return 403 when updating others post', async () => {
      const postId = new Types.ObjectId();
      const othersUserId = new Types.ObjectId();

      const mockPost = {
        _id: postId,
        authorId: othersUserId,
        text: 'Someone elses post',
      };

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockPost);

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', mockToken)
        .field('text', 'Hacked content');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when post not found', async () => {
      const postId = new Types.ObjectId();

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', mockToken)
        .field('text', 'Updated');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/posts/:id - Delete Post', () => {
    it('should delete own post', async () => {
      const postId = new Types.ObjectId();

      const mockPost = {
        _id: postId,
        authorId: new Types.ObjectId(mockUserId),
        imageUrl: undefined,
      };

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValueOnce(mockPost);

      (PostModel.default.findByIdAndDelete as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockPost);

      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Post deleted successfully');
    });

    it('should return 403 when deleting others post', async () => {
      const postId = new Types.ObjectId();
      const othersUserId = new Types.ObjectId();

      const mockPost = {
        _id: postId,
        authorId: othersUserId,
      };

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(mockPost);

      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 when post not found', async () => {
      const postId = new Types.ObjectId();

      (PostModel.default.findById as jest.Mock) = jest
        .fn()
        .mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', mockToken);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/posts/:id - Get Single Post', () => {
    it('should return a single post', async () => {
      const postId = new Types.ObjectId();

      const mockPost = {
        _id: postId,
        authorId: { username: 'testuser' },
        text: 'Post content',
        createdAt: new Date(),
      };

      (PostModel.default.findById as jest.Mock) = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPost),
      });

      const response = await request(app).get(`/api/posts/${postId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('text', 'Post content');
    });

    it('should return 404 for non-existent post', async () => {
      const postId = new Types.ObjectId();

      (PostModel.default.findById as jest.Mock) = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const response = await request(app).get(`/api/posts/${postId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});
