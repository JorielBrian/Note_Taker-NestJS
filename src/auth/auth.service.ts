import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { and, eq, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { sessions, users } from '../db/schema';
import { JWT_ISSUER } from './jwt-auth.guard';

export interface PublicUser {
  id: string;
  username: string;
}

@Injectable()
export class AuthService {
  // Verified against when the username is unknown, so response time doesn't reveal which accounts exist.
  private readonly dummyHash = argon2.hash(randomBytes(16).toString('hex'));

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly jwt: JwtService,
  ) {}

  async register(username: string, password: string): Promise<PublicUser> {
    const passwordHash = await argon2.hash(password);
    const [created] = await this.db
      .insert(users)
      .values({ username, passwordHash })
      .onConflictDoNothing({ target: users.username })
      .returning({ id: users.id, username: users.username });
    if (!created) throw new ConflictException('This username is already taken');
    return created;
  }

  async login(username: string, password: string): Promise<PublicUser> {
    const [user] = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    const hash = user?.passwordHash ?? (await this.dummyHash);
    const valid = await argon2.verify(hash, password).catch(() => false);
    if (!user || !valid) throw new UnauthorizedException('Invalid username or password');
    return { id: user.id, username: user.username };
  }

  async findPublicUser(id: string): Promise<PublicUser> {
    const [user] = await this.db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (!user) throw new UnauthorizedException();
    return user;
  }

  async signToken(userId: string): Promise<string> {
    const [session] = await this.db
      .insert(sessions)
      .values({ userId })
      .returning({ id: sessions.id });
    return this.jwt.signAsync(
      { sid: session.id },
      { subject: userId, issuer: JWT_ISSUER, algorithm: 'HS256' },
    );
  }

  /**
   * Validate inactivity using PostgreSQL's clock, not the application server clock.
   * A request exactly at the configured timeout is expired. last_activity_at is
   * only written when it is strictly more than five minutes old.
   */
  async isSessionActive(sessionId: string, idleTimeoutMinutes: number): Promise<boolean> {
    const [session] = await this.db
      .select({
        expired: sql<boolean>`EXTRACT(EPOCH FROM (now() - ${sessions.lastActivityAt})) >= ${idleTimeoutMinutes * 60}`,
        refreshDue: sql<boolean>`now() - ${sessions.lastActivityAt} > interval '5 minutes'`,
      })
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session) return false;
    if (session.expired) {
      await this.db.delete(sessions).where(eq(sessions.id, sessionId));
      return false;
    }

    if (session.refreshDue) {
      await this.db
        .update(sessions)
        .set({ lastActivityAt: sql`now()` })
        .where(
          and(
            eq(sessions.id, sessionId),
            sql`${sessions.lastActivityAt} < now() - interval '5 minutes'`,
          ),
        );
    }
    return true;
  }

  async revokeSession(token: unknown): Promise<void> {
    if (typeof token !== 'string' || !token) return;
    try {
      const payload = await this.jwt.verifyAsync<{ sid?: string }>(token, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        ignoreExpiration: true,
      });
      if (payload.sid) await this.db.delete(sessions).where(eq(sessions.id, payload.sid));
    } catch {
      // Logout must still clear the browser cookie when the token is malformed or expired.
    }
  }
}
