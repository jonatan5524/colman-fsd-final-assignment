import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import crypto from 'crypto';

export interface TokenPayload extends JwtPayload {
	userId: string;
}

const getJwtSecret = (): string => {
	const secret = process.env.JWT_SECRET;
	if (!secret) {
		throw new Error('JWT_SECRET is not defined');
	}
	return secret;
};

const getJwtRefreshSecret = (): string => {
	const secret = process.env.JWT_REFRESH_SECRET;
	if (!secret) {
		throw new Error('JWT_REFRESH_SECRET is not defined');
	}
	return secret;
};

const generateJti = (): string => crypto.randomBytes(16).toString('hex');

export const generateAccessToken = (userId: Types.ObjectId | string): string => {
	return jwt.sign(
		{ userId: userId.toString() },
		getJwtSecret(),
		{
			expiresIn: (process.env.JWT_EXPIRATION || '15m') as SignOptions['expiresIn'],
			jwtid: generateJti(),
		}
	);
};

export const generateRefreshToken = (userId: Types.ObjectId | string): string => {
	return jwt.sign(
		{ userId: userId.toString() },
		getJwtRefreshSecret(),
		{
			expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as SignOptions['expiresIn'],
			jwtid: generateJti(),
		}
	);
};

export const verifyAccessToken = (token: string): TokenPayload => {
	return jwt.verify(token, getJwtSecret()) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
	return jwt.verify(token, getJwtRefreshSecret()) as TokenPayload;
};

export const generateTokens = (userId: Types.ObjectId | string): { accessToken: string; refreshToken: string } => {
	return {
		accessToken: generateAccessToken(userId),
		refreshToken: generateRefreshToken(userId),
	};
};
