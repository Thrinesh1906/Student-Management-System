import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { User, IUser, UserRole } from '../models/User';
import { RefreshToken } from '../models/RefreshToken';
import { ApiError } from '../utils/apiError';
import { AuthPayload } from '../middleware/auth';
import { getRedis } from '../config/redis';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function signAccessToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn } as jwt.SignOptions);
}

function signRefreshToken(payload: { userId: string; tokenId: string }): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
}

export async function registerUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}): Promise<IUser> {
  const existing = await User.findOne({ email: data.email.toLowerCase() });
  if (existing) throw new ApiError(409, 'Email already registered');

  const hashed = await hashPassword(data.password);
  const user = await User.create({
    ...data,
    email: data.email.toLowerCase(),
    password: hashed,
  });
  logger.info('User registered', { userId: user._id, role: user.role });
  return user;
}

export async function loginUser(
  email: string,
  password: string,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !user.isActive) {
    logger.warn('Failed login attempt', { email });
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    logger.warn('Failed login attempt - wrong password', { email });
    throw new ApiError(401, 'Invalid credentials');
  }

  user.lastLogin = new Date();
  await user.save();

  const payload: AuthPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const tokenId = uuidv4();
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    userId: user._id,
    token: tokenId,
    expiresAt,
    userAgent: meta?.userAgent,
    ipAddress: meta?.ipAddress,
  });

  try {
    const redis = getRedis();
    await redis.setex(`session:${user._id}`, 7 * 24 * 3600, JSON.stringify({ tokenId, role: user.role }));
  } catch {
    logger.warn('Redis unavailable, session not cached');
  }

  logger.info('User logged in', { userId: user._id });
  user.password = '';
  return { user, accessToken, refreshToken };
}

export async function refreshAccessToken(
  refreshTokenStr: string
): Promise<{ accessToken: string; refreshToken: string }> {
  let decoded: { userId: string; tokenId: string };
  try {
    decoded = jwt.verify(refreshTokenStr, config.jwt.refreshSecret) as { userId: string; tokenId: string };
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const stored = await RefreshToken.findOne({
    userId: decoded.userId,
    token: decoded.tokenId,
    isRevoked: false,
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token expired or revoked');
  }

  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new ApiError(401, 'User not found');

  stored.isRevoked = true;
  await stored.save();

  const newTokenId = uuidv4();
  const payload: AuthPayload = { userId: user._id.toString(), email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ userId: user._id.toString(), tokenId: newTokenId });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  await RefreshToken.create({ userId: user._id, token: newTokenId, expiresAt });

  return { accessToken, refreshToken };
}

export async function logoutUser(userId: string, refreshTokenStr?: string): Promise<void> {
  if (refreshTokenStr) {
    try {
      const decoded = jwt.verify(refreshTokenStr, config.jwt.refreshSecret) as { userId: string; tokenId: string };
      await RefreshToken.updateOne({ token: decoded.tokenId }, { isRevoked: true });
    } catch {
      /* ignore invalid token on logout */
    }
  }
  await RefreshToken.updateMany({ userId, isRevoked: false }, { isRevoked: true });
  try {
    const redis = getRedis();
    await redis.del(`session:${userId}`);
  } catch {
    logger.warn('Redis unavailable during logout');
  }
  logger.info('User logged out', { userId });
}
