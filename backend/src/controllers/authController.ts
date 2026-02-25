/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/tokenUtils';
import { isGoogleOAuthConfigured, getGoogleAuthUrl, exchangeCodeForTokens, getGoogleUserInfo } from '../services/googleOAuth';

const SALT_ROUNDS = 10;

export const register = async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password, username } = req.body;

		if (!email || !password || !username) {
			res.status(400).json({ message: 'Email, password, and username are required' });
			return;
		}

		if (password.length < 6) {
			res.status(400).json({ message: 'Password must be at least 6 characters' });
			return;
		}

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			res.status(400).json({ message: 'User with this email already exists' });
			return;
		}

		const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

		const user = await User.create({
			email,
			password: hashedPassword,
			username,
			profilePicUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(
				username,
			)}&background=random`,
		});


		const tokens = generateTokens(user._id);

		const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
		user.refreshTokens.push(hashedRefreshToken);
		await user.save();

		res.status(201).json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			user: {
				_id: user._id,
				email: user.email,
				username: user.username,
				profilePicUrl: user.profilePicUrl,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		});
	} catch (error) {
		console.error('Register error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

export const login = async (req: Request, res: Response): Promise<void> => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			res.status(400).json({ message: 'Email and password are required' });
			return;
		}

		const user = await User.findOne({ email });
		if (!user) {
			res.status(401).json({ message: 'Invalid credentials' });
			return;
		}

		if (!user.password) {
			res.status(401).json({ message: 'Please login with Google' });
			return;
		}

		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			res.status(401).json({ message: 'Invalid credentials' });
			return;
		}


		const tokens = generateTokens(user._id);
		// Hash the refresh token before storing
		const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
		user.refreshTokens.push(hashedRefreshToken);
		await user.save();

		res.json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			user: {
				_id: user._id,
				email: user.email,
				username: user.username,
				profilePicUrl: user.profilePicUrl,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
			},
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
	try {
		const { refreshToken: token } = req.body;

		if (!token) {
			res.status(400).json({ message: 'Refresh token is required' });
			return;
		}

		let payload;
		try {
			payload = verifyRefreshToken(token);
		} catch {
			res.status(401).json({ message: 'Invalid refresh token' });
			return;
		}

		const user = await User.findById(payload.userId);
		if (!user) {
			res.status(401).json({ message: 'User not found' });
			return;
		}


		// Find the hashed refresh token in the user's list
		let tokenIndex = -1;
		for (let i = 0; i < user.refreshTokens.length; i++) {
			const match = await bcrypt.compare(token, user.refreshTokens[i]);
			if (match) {
				tokenIndex = i;
				break;
			}
		}
		if (tokenIndex === -1) {
			// Token reuse detected - possible token theft
			// Invalidate all refresh tokens for security
			user.refreshTokens = [];
			await user.save();
			res.status(401).json({ message: 'Refresh token has been revoked' });
			return;
		}

		// Remove the used token
		user.refreshTokens.splice(tokenIndex, 1);

		const tokens = generateTokens(user._id);

		// Hash the new refresh token before storing
		const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
		user.refreshTokens.push(hashedRefreshToken);
		await user.save();

		res.json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		});
	} catch (error) {
		console.error('Refresh token error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

export const logout = async (req: Request, res: Response): Promise<void> => {
	try {
		const { refreshToken: token } = req.body;

		if (!token) {
			res.status(400).json({ message: 'Refresh token is required' });
			return;
		}

		let payload;
		try {
			payload = verifyRefreshToken(token);
		} catch {
			res.json({ message: 'Logged out successfully' });
			return;
		}


		const user = await User.findById(payload.userId);
		if (user) {
			user.refreshTokens = [];
			await user.save();
		}

		res.json({ message: 'Logged out successfully' });
	} catch (error) {
		console.error('Logout error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
	if (!isGoogleOAuthConfigured()) {
		res.status(501).json({ message: 'Google OAuth is not configured' });
		return;
	}

	res.redirect(getGoogleAuthUrl());
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
	const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

	try {
		const { code, error } = req.query;

		if (error || !code) {
			res.redirect(`${frontendUrl}/login?error=oauth_denied`);
			return;
		}

		const googleTokens = await exchangeCodeForTokens(code as string);

		const googleUser = await getGoogleUserInfo(googleTokens.access_token);

		let user = await User.findOne({ googleId: googleUser.id });

		if (!user) {
			user = await User.findOne({ email: googleUser.email });
			if (user) {
				user.googleId = googleUser.id;
				if (!user.profilePicUrl) {
					user.profilePicUrl =
						googleUser.picture ||
						`https://ui-avatars.com/api/?name=${encodeURIComponent(
							user.username,
						)}&background=random`;
				}
				await user.save();
			} else {
				user = await User.create({
					googleId: googleUser.id,
					email: googleUser.email,
					username: googleUser.name || `user_${googleUser.id}`,
					profilePicUrl:
						googleUser.picture ||
						`https://ui-avatars.com/api/?name=${encodeURIComponent(
							googleUser.name || googleUser.email,
						)}&background=random`,
				});
			}
		}


		const tokens = generateTokens(user._id);
		// Hash the refresh token before storing
		const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, SALT_ROUNDS);
		user.refreshTokens.push(hashedRefreshToken);
		await user.save();

		res.redirect(
			`${frontendUrl}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`
		);
	} catch (error) {
		console.error('Google callback error:', error);
		res.redirect(`${frontendUrl}/login?error=oauth_failed`);
	}
};
