import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { CurrentUserId } from './current-user.decorator';
import { LoginDto, RegisterDto } from './dto/credentials.dto';
import { AuthService, PublicUser } from './auth.service';
import { AUTH_COOKIE } from './auth.constants';
import { Public } from './public.decorator';

const AUTH_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Env,
  ) {}

  private cookieOptions(): CookieOptions {
    return { httpOnly: true, sameSite: 'lax', secure: this.env.isProd, path: '/' };
  }

  private async startSession(res: Response, user: PublicUser): Promise<PublicUser> {
    const token = await this.auth.signToken(user.id);
    res.cookie(AUTH_COOKIE, token, {
      ...this.cookieOptions(),
      maxAge: this.env.jwtExpiresInDays * 24 * 60 * 60 * 1000,
    });
    return user;
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    return this.startSession(res, await this.auth.register(dto.username, dto.password));
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.startSession(res, await this.auth.login(dto.username, dto.password));
  }

  @Public()
  @HttpCode(204)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.revokeSession(req.cookies?.[AUTH_COOKIE]);
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
  }

  @HttpCode(200)
  @Post('keep-alive')
  keepAlive() {
    // The global JWT guard records activity before this handler runs.
    return { ok: true };
  }

  @Get('me')
  me(@CurrentUserId() userId: string) {
    return this.auth.findPublicUser(userId);
  }
}
