/// <reference path="../types/express.d.ts" />
import { Request, Response } from 'express';
import User from '../models/User';
import fs from 'fs';
import path from 'path';
import { Types } from 'mongoose';

export const getMe = async (req: Request, res: Response): Promise<void> => {
	try {
		if (!req.user) {
			res.status(401).json({ message: 'Not authenticated' });
			return;
		}

		const user = await User.findById(req.user.userId).select('-password -refreshTokens');
		if (!user) {
			res.status(404).json({ message: 'User not found' });
			return;
		}

		res.json({
			_id: user._id,
			email: user.email,
			username: user.username,
			profilePicUrl: user.profilePicUrl,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	} catch (error) {
		console.error('Get me error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
	try {
		const { userId } = req.params;
		const { username } = req.body;

		if (req.user?.userId.toString() !== userId) {
			res.status(403).json({ message: 'You are not authorized to update this profile' });
			return;
		}

		const user = await User.findById(userId);
		if (!user) {
			res.status(404).json({ message: 'User not found' });
			return;
		}

		if (username) {
			user.username = username;
		}

		if (req.file) {
			user.profilePicUrl = `/uploads/profiles/${req.file.filename}`;
		}

		await user.save();

		res.json({
			_id: user._id,
			email: user.email,
			username: user.username,
			profilePicUrl: user.profilePicUrl,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		});
	} catch (error) {
		console.error('Update profile error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
};