export interface Env {
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresInDays: number;
  sessionIdleTimeoutMinutes: number;
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
  const sessionIdleTimeoutMinutes = Number(source.SESSION_IDLE_TIMEOUT_MINUTES ?? 180);
  if (!Number.isInteger(sessionIdleTimeoutMinutes) || sessionIdleTimeoutMinutes < 1) {
    throw new Error('SESSION_IDLE_TIMEOUT_MINUTES must be a positive integer');
  }
  return {
    databaseUrl,
    jwtSecret,
    jwtExpiresInDays: Number(source.JWT_EXPIRES_IN_DAYS ?? 7),
    sessionIdleTimeoutMinutes,
    port: Number(source.PORT ?? 4000),
    webOrigin: source.WEB_ORIGIN ?? 'http://localhost:3000',
    isProd: source.NODE_ENV === 'production',
  };
}
