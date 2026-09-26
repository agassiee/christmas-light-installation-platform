import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../lib/prisma';
import { env } from '../../config/env';
import crypto from 'crypto';

export class AuthService {
  static async createInitialAdmin(email: string, passwordRaw: string) {
    const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existing) {
      throw new Error('Admin already exists');
    }
    const passwordHash = await bcrypt.hash(passwordRaw, 10);
    return prisma.user.create({
      data: { email, passwordHash, role: 'ADMIN' }
    });
  }

  static async login(email: string, passwordRaw: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) {
      throw { status: 401, message: 'Invalid credentials' };
    }
    
    const isValid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isValid) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    return this.generateTokens(user.id, user.role);
  }

  static async refresh(refreshTokenRaw: string) {
    let payload;
    try {
      payload = jwt.verify(refreshTokenRaw, env.JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw { status: 401, message: 'Invalid refresh token' };
    }

    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        userId: payload.userId,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      }
    });

    if (!storedToken) {
      throw { status: 401, message: 'Invalid or expired refresh token' };
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active) {
      throw { status: 401, message: 'User inactive or not found' };
    }

    // Revoke old token for rotation
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    return this.generateTokens(user.id, user.role);
  }

  static async logout(refreshTokenRaw: string) {
    if (!refreshTokenRaw) return;
    const tokenHash = crypto.createHash('sha256').update(refreshTokenRaw).digest('hex');
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }

  private static async generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return { accessToken, refreshToken };
  }
}
