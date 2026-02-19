import request from 'supertest';
import app from '../app';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { generateRefreshToken } from '../utils/tokenUtils';

describe('Auth Endpoints', () => {
	describe('POST /auth/register', () => {
		it('should register a new user successfully', async () => {
			const res = await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: 'password123',
					username: 'testuser',
				});

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty('accessToken');
			expect(res.body).toHaveProperty('refreshToken');
			expect(res.body.user).toHaveProperty('email', 'test@example.com');
			expect(res.body.user).toHaveProperty('username', 'testuser');
			expect(res.body.user).not.toHaveProperty('password');
		});

		it('should fail with missing email', async () => {
			const res = await request(app)
				.post('/auth/register')
				.send({
					password: 'password123',
					username: 'testuser',
				});

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message');
		});

		it('should fail with missing password', async () => {
			const res = await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					username: 'testuser',
				});

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message');
		});

		it('should fail with missing username', async () => {
			const res = await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: 'password123',
				});

			expect(res.status).toBe(400);
			expect(res.body).toHaveProperty('message');
		});

		it('should fail with short password', async () => {
			const res = await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: '12345',
					username: 'testuser',
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toBe('Password must be at least 6 characters');
		});

		it('should fail with duplicate email', async () => {
			// Create first user
			await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: 'password123',
					username: 'testuser1',
				});

			// Try to create second user with same email
			const res = await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: 'password456',
					username: 'testuser2',
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toBe('User with this email already exists');
		});
	});

	describe('POST /auth/login', () => {
		beforeEach(async () => {
			// Create a test user
			const hashedPassword = await bcrypt.hash('password123', 10);
			await User.create({
				email: 'test@example.com',
				password: hashedPassword,
				username: 'testuser',
			});
		});

		it('should login successfully with valid credentials', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'test@example.com',
					password: 'password123',
				});

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('accessToken');
			expect(res.body).toHaveProperty('refreshToken');
			expect(res.body.user).toHaveProperty('email', 'test@example.com');
		});

		it('should fail with wrong password', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'test@example.com',
					password: 'wrongpassword',
				});

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Invalid credentials');
		});

		it('should fail with non-existent user', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'nonexistent@example.com',
					password: 'password123',
				});

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Invalid credentials');
		});

		it('should fail with missing email', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					password: 'password123',
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toBe('Email and password are required');
		});

		it('should fail with missing password', async () => {
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'test@example.com',
				});

			expect(res.status).toBe(400);
			expect(res.body.message).toBe('Email and password are required');
		});

		it('should fail for OAuth-only user', async () => {
			// Create OAuth-only user
			await User.create({
				email: 'oauth@example.com',
				username: 'oauthuser',
				googleId: 'google123',
			});

			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'oauth@example.com',
					password: 'password123',
				});

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Please login with Google');
		});
	});

	describe('POST /auth/refresh', () => {
		let validRefreshToken: string;
		let userId: string;

		beforeEach(async () => {
			// Create a test user with a refresh token
			const hashedPassword = await bcrypt.hash('password123', 10);
			const user = await User.create({
				email: 'test@example.com',
				password: hashedPassword,
				username: 'testuser',
			});
			userId = user._id.toString();
			validRefreshToken = generateRefreshToken(user._id);
			user.refreshTokens.push(validRefreshToken);
			await user.save();
		});

		it('should refresh tokens successfully', async () => {
			const res = await request(app)
				.post('/auth/refresh')
				.send({
					refreshToken: validRefreshToken,
				});

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('accessToken');
			expect(res.body).toHaveProperty('refreshToken');
			expect(res.body.refreshToken).not.toBe(validRefreshToken); // Token rotation
		});

		it('should fail with missing refresh token', async () => {
			const res = await request(app)
				.post('/auth/refresh')
				.send({});

			expect(res.status).toBe(400);
			expect(res.body.message).toBe('Refresh token is required');
		});

		it('should fail with invalid refresh token', async () => {
			const res = await request(app)
				.post('/auth/refresh')
				.send({
					refreshToken: 'invalid-token',
				});

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Invalid refresh token');
		});

		it('should fail with reused refresh token (token rotation)', async () => {
			// First refresh - should succeed
			await request(app)
				.post('/auth/refresh')
				.send({
					refreshToken: validRefreshToken,
				});

			// Second refresh with same token - should fail
			const res = await request(app)
				.post('/auth/refresh')
				.send({
					refreshToken: validRefreshToken,
				});

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Refresh token has been revoked');

			// All tokens should be invalidated (security measure)
			const user = await User.findById(userId);
			expect(user?.refreshTokens).toHaveLength(0);
		});
	});

	describe('POST /auth/logout', () => {
		let validRefreshToken: string;

		beforeEach(async () => {
			// Create a test user with a refresh token
			const hashedPassword = await bcrypt.hash('password123', 10);
			const user = await User.create({
				email: 'test@example.com',
				password: hashedPassword,
				username: 'testuser',
			});
			validRefreshToken = generateRefreshToken(user._id);
			user.refreshTokens.push(validRefreshToken);
			await user.save();
		});

		it('should logout successfully', async () => {
			const res = await request(app)
				.post('/auth/logout')
				.send({
					refreshToken: validRefreshToken,
				});

			expect(res.status).toBe(200);
			expect(res.body.message).toBe('Logged out successfully');

			// Token should be removed from user
			const user = await User.findOne({ email: 'test@example.com' });
			expect(user?.refreshTokens).not.toContain(validRefreshToken);
		});

		it('should succeed even with invalid refresh token', async () => {
			const res = await request(app)
				.post('/auth/logout')
				.send({
					refreshToken: 'invalid-token',
				});

			expect(res.status).toBe(200);
			expect(res.body.message).toBe('Logged out successfully');
		});

		it('should fail with missing refresh token', async () => {
			const res = await request(app)
				.post('/auth/logout')
				.send({});

			expect(res.status).toBe(400);
			expect(res.body.message).toBe('Refresh token is required');
		});
	});

	describe('GET /auth/me', () => {
		let accessToken: string;

		beforeEach(async () => {
			// Register a user and get access token
			const res = await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: 'password123',
					username: 'testuser',
				});
			accessToken = res.body.accessToken;
		});

		it('should return user profile with valid token', async () => {
			const res = await request(app)
				.get('/auth/me')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('email', 'test@example.com');
			expect(res.body).toHaveProperty('username', 'testuser');
			expect(res.body).not.toHaveProperty('password');
			expect(res.body).not.toHaveProperty('refreshTokens');
		});

		it('should fail without authorization header', async () => {
			const res = await request(app)
				.get('/auth/me');

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Access token required');
		});

		it('should fail with invalid token', async () => {
			const res = await request(app)
				.get('/auth/me')
				.set('Authorization', 'Bearer invalid-token');

			expect(res.status).toBe(403);
			expect(res.body.message).toBe('Invalid access token');
		});
	});

	describe('POST /auth/logout-all', () => {
		let accessToken: string;
		let userId: string;

		beforeEach(async () => {
			// Create user and get tokens
			const hashedPassword = await bcrypt.hash('password123', 10);
			const user = await User.create({
				email: 'test@example.com',
				password: hashedPassword,
				username: 'testuser',
				refreshTokens: ['token1', 'token2', 'token3'],
			});
			userId = user._id.toString();

			// Login to get access token
			const res = await request(app)
				.post('/auth/login')
				.send({
					email: 'test@example.com',
					password: 'password123',
				});
			accessToken = res.body.accessToken;
		});

		it('should logout from all devices', async () => {
			const res = await request(app)
				.post('/auth/logout-all')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(res.status).toBe(200);
			expect(res.body.message).toBe('Logged out from all devices');

			// All tokens should be removed
			const user = await User.findById(userId);
			expect(user?.refreshTokens).toHaveLength(0);
		});

		it('should fail without authentication', async () => {
			const res = await request(app)
				.post('/auth/logout-all');

			expect(res.status).toBe(401);
		});
	});
});
