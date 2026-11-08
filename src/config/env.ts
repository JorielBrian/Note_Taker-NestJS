export interface Env {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresInDays: number;
  port: number;
  webOrigin: string;
  isProd: boolean;
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const databaseUrl = source.DATABASE_URL;
  const jwtSecret = source.JWT_SECRET;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error('JWT_SECRET is required and must be at least 32 characters');
  }
  return {
    databaseUrl,
    jwtSecret,
    jwtExpiresInDays: Number(source.JWT_EXPIRES_IN_DAYS ?? 7),
    port: Number(source.PORT ?? 4000),
    webOrigin: source.WEB_ORIGIN ?? 'http://localhost:3000',
    isProd: source.NODE_ENV === 'production',
  };
}
