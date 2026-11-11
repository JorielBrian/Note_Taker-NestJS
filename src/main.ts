import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { loadEnv } from './config/env';

async function bootstrap() {
  const env = loadEnv();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.useBodyParser('json', { limit: '1mb' });
  configureApp(app, {
    trustProxy: Number(process.env.TRUST_PROXY ?? 0),
    webOrigin: env.webOrigin,
  });
  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 4000);
  console.log(`API listening on :${env.port}`);
}

void bootstrap();
