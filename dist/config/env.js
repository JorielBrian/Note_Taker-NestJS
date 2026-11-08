"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadEnv = loadEnv;
function loadEnv(source = process.env) {
    const databaseUrl = source.DATABASE_URL;
    const jwtSecret = source.JWT_SECRET;
    if (!databaseUrl)
        throw new Error('DATABASE_URL is required');
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
//# sourceMappingURL=env.js.map