import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from './auth.service';
import { env } from '../../config/env';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const bootstrapSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  bootstrapSecret: z.string()
});

const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export class AuthController {
  static async bootstrapAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, bootstrapSecret } = bootstrapSchema.parse(req.body);
      if (bootstrapSecret !== 'INSECURE_BOOTSTRAP_123') { // Ideally from env in real app
        return res.status(403).json({ success: false, error: { message: 'Invalid bootstrap secret' } });
      }
      const admin = await AuthService.createInitialAdmin(email, password);
      res.json({ success: true, data: { id: admin.id, email: admin.email } });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const { accessToken, refreshToken } = await AuthService.login(email, password);
      
      res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
      res.json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const oldToken = req.cookies.refreshToken;
      if (!oldToken) {
        return res.status(401).json({ success: false, error: { message: 'No refresh token' } });
      }

      const { accessToken, refreshToken } = await AuthService.refresh(oldToken);
      
      res.cookie('refreshToken', refreshToken, COOKIE_OPTS);
      res.json({ success: true, data: { accessToken } });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const oldToken = req.cookies.refreshToken;
      if (oldToken) {
        await AuthService.logout(oldToken);
      }
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: any, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: { userId: req.user.userId, role: req.user.role } });
    } catch (error) {
      next(error);
    }
  }
}
