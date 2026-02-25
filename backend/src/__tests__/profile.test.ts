import request from 'supertest';
import app from '../app';
import User from '../models/User';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

describe('Profile Endpoints', () => {
	describe('GET /profile/', () => {
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
				.get('/profile/')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(res.status).toBe(200);
			expect(res.body).toHaveProperty('email', 'test@example.com');
			expect(res.body).toHaveProperty('username', 'testuser');
			expect(res.body).not.toHaveProperty('password');
			expect(res.body).not.toHaveProperty('refreshTokens');
		});

		it('should fail without authorization header', async () => {
			const res = await request(app)
				.get('/profile/');

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Access token required');
		});

		it('should fail with invalid token', async () => {
			const res = await request(app)
				.get('/profile/')
				.set('Authorization', 'Bearer invalid-token');

			expect(res.status).toBe(403);
			expect(res.body.message).toBe('Invalid access token');
		});

		it('should fail when user is deleted after token generation', async () => {
			// Delete the user after getting the token
			await User.deleteOne({ email: 'test@example.com' });

			const res = await request(app)
				.get('/profile/')
				.set('Authorization', `Bearer ${accessToken}`);

			expect(res.status).toBe(404);
			expect(res.body.message).toBe('User not found');
		});

		it('should fail with expired token', async () => {
			// Create an expired token
			const secret = process.env.JWT_SECRET || 'test-secret-key';
			const expiredToken = jwt.sign(
				{ userId: new mongoose.Types.ObjectId().toString() },
				secret,
				{ expiresIn: '-1s' }
			);

			const res = await request(app)
				.get('/profile/')
				.set('Authorization', `Bearer ${expiredToken}`);

			expect(res.status).toBe(401);
			expect(res.body.message).toBe('Access token expired');
		});
	});

	describe('PUT /profile/users/:userId', () => {
		let accessToken: string;
		let userId: string;

		beforeEach(async () => {
			const res = await request(app)
				.post('/auth/register')
				.send({
					email: 'test@example.com',
					password: 'password123',
					username: 'testuser',
				});
			accessToken = res.body.accessToken;
			userId = res.body.user._id;
		});

		it('should update user profile with new username', async () => {
			const res = await request(app)
				.put(`/profile/users/${userId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ username: 'newusername' });

			expect(res.status).toBe(200);
			expect(res.body.username).toBe('newusername');
		});

		it('should update user profile with new profile picture', async () => {
			const res = await request(app)
				.put(`/profile/users/${userId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.attach('file', 'src/__tests__/test-image.png');

			expect(res.status).toBe(200);
			expect(res.body.profilePicUrl).toContain('profile-');
		});

		it('should not allow a user to update another user profile', async () => {
			const otherUserRes = await request(app)
				.post('/auth/register')
				.send({
					email: 'other@example.com',
					password: 'password123',
					username: 'otheruser',
				});
			const otherUserId = otherUserRes.body.user._id;

			const res = await request(app)
				.put(`/profile/users/${otherUserId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ username: 'newusername' });

			expect(res.status).toBe(403);
		});

		it('should return 403 if user to update does not exist', async () => {
			const nonExistentId = new mongoose.Types.ObjectId();
			const res = await request(app)
				.put(`/profile/users/${nonExistentId}`)
				.set('Authorization', `Bearer ${accessToken}`)
				.send({ username: 'newusername' });

			expect(res.status).toBe(403);
		});
	});
});