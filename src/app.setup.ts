import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

/** Shared by main.ts and the e2e tests so tests exercise the real configuration. */
export function configureApp(app: INestApplication, opts: { trustProxy?: number; webOrigin?: string } = {}) {
  const express = app as NestExpressApplication;
  if (opts.trustProxy) express.set('trust proxy', opts.trustProxy);
  app.use(helmet());
  app.use(cookieParser());
  if (opts.webOrigin) app.enableCors({ origin: opts.webOrigin, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  return app;
}
