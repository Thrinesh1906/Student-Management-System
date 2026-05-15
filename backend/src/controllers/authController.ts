import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/authService';
import { User } from '../models/User';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password, {
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip,
  });
  res.json({
    success: true,
    data: {
      user: {
        id: result.user._id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
  });
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshAccessToken(refreshToken);
  res.json({ success: true, data: tokens });
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logoutUser(req.user!.userId, req.body.refreshToken);
  res.json({ success: true, message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  res.json({
    success: true,
    data: {
      id: user!._id,
      email: user!.email,
      firstName: user!.firstName,
      lastName: user!.lastName,
      role: user!.role,
    },
  });
});
