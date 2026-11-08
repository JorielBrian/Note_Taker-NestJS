import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { users } from '../db/schema';
import { JWT_ISSUER } from './jwt-auth.guard';

 export interface PublicUser {
   id: string;
   username: string;
 }  

@Injectable()
export class AuthService {
  // Verified against when the email is unknown, so response time doesn't reveal which emails exist.
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

  signToken(userId: string): Promise<string> {
    return this.jwt.signAsync({}, { subject: userId, issuer: JWT_ISSUER, algorithm: 'HS256' });
  }
}
