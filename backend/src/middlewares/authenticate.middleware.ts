import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.middleware.js';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. No token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AppError('Authentication required. Invalid token format.', 401);
    }

    const { payload } = await jwtVerify(token, secret);

    req.user = {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as string,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    const err = error as Error;
    if (err.name === 'JWTExpired' || err.message?.includes('expired')) {
      next(new AppError('Token expired. Please refresh your session.', 401));
    } else {
      next(new AppError('Invalid authentication token.', 401));
    }
  }
}
