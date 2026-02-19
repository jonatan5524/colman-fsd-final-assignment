import { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  req.userId = (req.headers["x-user-id"] as string) || "mock-user-id-123";
  req.user = { id: req.userId };
  next();
};
