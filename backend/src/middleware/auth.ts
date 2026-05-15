import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, UserRole } from '../models/User';
import { ApiError } from '../utils/apiError';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required');
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User not found or inactive');
    }
    req.user = { userId: decoded.userId, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      next(new ApiError(401, 'Invalid or expired token'));
    } else {
      next(err);
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
};
