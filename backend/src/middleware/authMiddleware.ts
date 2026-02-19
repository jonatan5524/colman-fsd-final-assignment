/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/tokenUtils';

export interface AuthRequest extends Request {
	user?: TokenPayload;
}

export const authenticateToken: RequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction
): void => {
	const authHeader = req.headers.authorization;
	const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

	if (!token) {
		res.status(401).json({ message: 'Access token required' });
		return;
	}

	try {
		const payload = verifyAccessToken(token);
		req.user = payload;
		next();
	} catch (error: unknown) {
		if (error instanceof Error && error.name === 'TokenExpiredError') {
			res.status(401).json({ message: 'Access token expired' });
			return;
		}
		res.status(403).json({ message: 'Invalid access token' });
	}
};
