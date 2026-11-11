import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions, Response } from 'express';
import type { AuthedRequest } from '../common/types';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { AuthService } from './auth.service';
import { AUTH_COOKIE, JWT_ISSUER } from './auth.constants';
import { IS_PUBLIC } from './public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private clearCookie(response: Response) {
    const options: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.env.isProd,
      path: '/',
    };
    response.clearCookie(AUTH_COOKIE, options);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const http = context.switchToHttp();
    const req = http.getRequest<AuthedRequest>();
    const res = http.getResponse<Response>();
    const token: unknown = req.cookies?.[AUTH_COOKIE];
    if (typeof token !== 'string' || !token) throw new UnauthorizedException();

    let payload: { sub?: string; sid?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: string; sid?: string }>(token, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
      });
    } catch (error) {
      this.clearCookie(res);
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired. Please sign in again.',
        });
      }
      throw new UnauthorizedException();
    }

    if (!payload.sub || !payload.sid) {
      this.clearCookie(res);
      throw new UnauthorizedException();
    }

    const sessionState = await this.auth.validateSession(
      payload.sid,
      this.env.sessionIdleTimeoutMinutes,
    );
    if (sessionState === 'expired') {
      this.clearCookie(res);
      throw new UnauthorizedException({
        code: 'SESSION_EXPIRED',
        message: 'You were logged out due to inactivity.',
      });
    }

    if (sessionState === 'refreshed') {
      const refreshedToken = await this.auth.signSessionToken(payload.sub, payload.sid);
      res.cookie(AUTH_COOKIE, refreshedToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: this.env.isProd,
        path: '/',
        maxAge: this.env.jwtExpiresInDays * 24 * 60 * 60 * 1000,
      });
    }

    req.user = { id: payload.sub, sessionId: payload.sid };
    return true;
  }
}
