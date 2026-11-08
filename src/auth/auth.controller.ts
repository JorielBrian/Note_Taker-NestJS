import { Body, Controller, Get, HttpCode, Inject, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Response } from 'express';
import { ENV } from '../config/config.module';
import type { Env } from '../config/env';
import { CurrentUserId } from './current-user.decorator';
import { LoginDto, RegisterDto } from './dto/credentials.dto';
import { AuthService, PublicUser } from './auth.service';
import { AUTH_COOKIE } from './jwt-auth.guard';
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
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(AUTH_COOKIE, this.cookieOptions());
  }

  @Get('me')
  me(@CurrentUserId() userId: string) {
    return this.auth.findPublicUser(userId);
  }
}
