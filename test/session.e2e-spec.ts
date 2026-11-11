import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { sql } from 'drizzle-orm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { DB, type Database } from '../src/db/db.module';
import { runMigrations } from '../src/db/migrate';

const TEST_DB = process.env.TEST_DATABASE_URL ?? 'postgres://notetaker:notetaker@localhost:5432/notetaker_test';
process.env.DATABASE_URL = TEST_DB;
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';
process.env.SESSION_IDLE_TIMEOUT_MINUTES = '10';

describe('session idle timeout', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let db: Database;

  beforeAll(async () => {
    await runMigrations(TEST_DB);
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(mod.createNestApplication());
    await app.init();
    http = app.getHttpServer();
    db = app.get<Database>(DB);
  });

  afterAll(async () => {
    await app.close();
  });

  async function createSession() {
    const agent = request.agent(http);
    const username = `session_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
    const response = await agent
      .post('/auth/register')
      .send({ username, password: 'valid-password-123' })
      .expect(201);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const cookie = cookies.find((value) => value.startsWith('access_token='));
    if (!cookie) throw new Error('Registration did not set access_token');
    const token = cookie.match(/access_token=([^;]+)/)?.[1];
    if (!token) throw new Error('Could not read access_token');
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { sid: string };
    return { agent, sessionId: payload.sid };
  }

  it('keeps an active session valid', async () => {
    const { agent } = await createSession();
    await agent.get('/auth/me').expect(200);
    await agent.get('/notebooks').expect(200);
  });

  it('expires at the configured idle-timeout boundary and clears the cookie', async () => {
    const { agent, sessionId } = await createSession();
    await db.execute(sql`UPDATE sessions SET last_activity_at = now() - interval '10 minutes' WHERE id = ${sessionId}`);

    const response = await agent.get('/auth/me').expect(401);
    expect(response.body.code).toBe('SESSION_EXPIRED');
    expect((response.headers['set-cookie'] as unknown as string[]).join(';')).toMatch(/access_token=;/);
    await agent.get('/auth/me').expect(401);
  });

  it('keep-alive refreshes last_activity_at when it is more than five minutes old', async () => {
    const { agent, sessionId } = await createSession();
    await db.execute(sql`UPDATE sessions SET last_activity_at = now() - interval '6 minutes' WHERE id = ${sessionId}`);

    const keepAliveResponse = await agent.post('/auth/keep-alive').expect(200);
    expect(keepAliveResponse.headers['set-cookie']).toBeDefined();
    const result = await db.execute(sql`SELECT last_activity_at > now() - interval '1 minute' AS recent FROM sessions WHERE id = ${sessionId}`);
    expect(result.rows[0]?.recent).toBe(true);
  });


  it('does not write last_activity_at again inside the five-minute refresh window', async () => {
    const { agent, sessionId } = await createSession();
    await db.execute(sql`UPDATE sessions SET last_activity_at = now() - interval '4 minutes' WHERE id = ${sessionId}`);
    const before = await db.execute(sql`SELECT last_activity_at FROM sessions WHERE id = ${sessionId}`);

    await agent.get('/auth/me').expect(200);
    const after = await db.execute(sql`SELECT last_activity_at FROM sessions WHERE id = ${sessionId}`);
    expect(after.rows[0]?.last_activity_at).toEqual(before.rows[0]?.last_activity_at);
  });

  it('logout revokes the server-side session', async () => {
    const { agent } = await createSession();
    await agent.post('/auth/logout').expect(204);
    await agent.get('/auth/me').expect(401);
  });
});
