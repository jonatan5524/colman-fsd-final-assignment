import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err.message && err.message.includes('Only image files are allowed')) {
    return res.status(400).json({ error: err.message });
  }

  if (err.status === 413) {
    return res.status(413).json({ error: 'File size too large (max 5MB)' });
  }

  res.status(500).json({ error: 'Internal server error' });
};
