import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { runMigrations } from '../src/db/migrate';

const TEST_DB = process.env.TEST_DATABASE_URL ?? 'postgres://notetaker:notetaker@localhost:5432/notetaker_test';
process.env.DATABASE_URL = TEST_DB;
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-123';

type Agent = ReturnType<typeof request.agent>;

describe('Note Taker API', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  const suffix = Date.now();
  const alice = { username: `alice_${suffix}`, password: 'correct horse battery' };
  const bob = { username: `bob_${suffix}`, password: 'another long password' };

  beforeAll(async () => {
    await runMigrations(TEST_DB);
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(mod.createNestApplication());
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  async function signUp(creds: { username: string; password: string }): Promise<Agent> {
    const agent = request.agent(http);
    await agent.post('/auth/register').send(creds).expect(201);
    return agent;
  }

  describe('auth', () => {
    it('registers, sets an httpOnly cookie, and never returns the hash', async () => {
      const res = await request(http).post('/auth/register').send({ username: `x_${suffix}`, password: 'longenough1' }).expect(201);
      expect(res.body).toEqual({ id: expect.any(String), username: `x_${suffix}` });
      const cookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
      expect(cookie).toMatch(/access_token=/);
      expect(cookie).toMatch(/HttpOnly/i);
      expect(cookie).toMatch(/SameSite=Lax/i);
    });

    it('rejects duplicate usernames (case-insensitive) and weak input', async () => {
      await signUp(alice);
      await request(http).post('/auth/register').send({ ...alice, username: alice.username.toUpperCase() }).expect(409);
      await request(http).post('/auth/register').send({ username: 'ab', password: 'longenough1' }).expect(400);
      await request(http).post('/auth/register').send({ username: `s_${suffix}`, password: 'short' }).expect(400);
    });

    it('logs in with right credentials and rejects wrong ones the same way', async () => {
      const agent = request.agent(http);
      await agent.post('/auth/login').send(alice).expect(200);
      await agent.get('/auth/me').expect(200).expect((r) => expect(r.body.username).toBe(alice.username));
      const wrongPass = await request(http).post('/auth/login').send({ ...alice, password: 'wrong-password' }).expect(401);
      const noUser = await request(http).post('/auth/login').send({ username: `ghost_${suffix}`, password: 'wrong-password' }).expect(401);
      expect(wrongPass.body.message).toBe(noUser.body.message);
    });

    it('logout clears the session', async () => {
      const agent = request.agent(http);
      await agent.post('/auth/login').send(alice).expect(200);
      await agent.post('/auth/logout').expect(204);
      await agent.get('/auth/me').expect(401);
    });

    it('denies by default: protected routes need a session, forged tokens fail', async () => {
      await request(http).get('/notebooks').expect(401);
      await request(http).get('/auth/me').expect(401);
      await request(http).get('/notebooks').set('Cookie', 'access_token=not.a.jwt').expect(401);
    });
  });

  describe('notebooks and notes', () => {
    let a: Agent;
    let b: Agent;
    let notebookId: string;
    let noteId: string;

    beforeAll(async () => {
      a = request.agent(http);
      await a.post('/auth/login').send(alice).expect(200);
      b = await signUp(bob);
    });

    it('creates, lists (with note counts), renames notebooks', async () => {
      const created = await a.post('/notebooks').send({ name: '  Work  ' }).expect(201);
      expect(created.body.name).toBe('Work');
      notebookId = created.body.id;
      await a.patch(`/notebooks/${notebookId}`).send({ name: 'Work 2026' }).expect(200);
      await a.post('/notebooks').send({ name: '   ' }).expect(400);
      const list = await a.get('/notebooks').expect(200);
      expect(list.body).toEqual([expect.objectContaining({ id: notebookId, name: 'Work 2026', noteCount: 0 })]);
    });

    it('creates, reads, updates and lists notes', async () => {
      const created = await a.post(`/notebooks/${notebookId}/notes`).send({ title: 'Plan', content: '# Hello' }).expect(201);
      noteId = created.body.id;
      await a.patch(`/notes/${noteId}`).send({ content: '# Hello **world**' }).expect(200);
      const got = await a.get(`/notes/${noteId}`).expect(200);
      expect(got.body).toMatchObject({ title: 'Plan', content: '# Hello **world**' });
      const list = await a.get(`/notebooks/${notebookId}/notes`).expect(200);
      expect(list.body).toEqual([expect.objectContaining({ id: noteId, title: 'Plan', snippet: '# Hello **world**' })]);
      expect(list.body[0]).not.toHaveProperty('content');
      const nb = await a.get('/notebooks').expect(200);
      expect(nb.body[0].noteCount).toBe(1);
    });

    it("hides one user's data from another (404, not 403)", async () => {
      expect((await b.get('/notebooks').expect(200)).body).toEqual([]);
      await b.get(`/notes/${noteId}`).expect(404);
      await b.patch(`/notes/${noteId}`).send({ title: 'pwned' }).expect(404);
      await b.delete(`/notes/${noteId}`).expect(404);
      await b.get(`/notebooks/${notebookId}/notes`).expect(404);
      await b.post(`/notebooks/${notebookId}/notes`).send({ title: 'injected' }).expect(404);
      await b.patch(`/notebooks/${notebookId}`).send({ name: 'pwned' }).expect(404);
      await b.delete(`/notebooks/${notebookId}`).expect(404);
      // still intact for the owner
      expect((await a.get(`/notes/${noteId}`).expect(200)).body.title).toBe('Plan');
    });

    it("cannot move a note into someone else's notebook", async () => {
      const bobNb = await b.post('/notebooks').send({ name: 'Bob private' }).expect(201);
      await a.patch(`/notes/${noteId}`).send({ notebookId: bobNb.body.id }).expect(404);
      expect((await a.get(`/notes/${noteId}`).expect(200)).body.notebookId).toBe(notebookId);
    });

    it('treats malformed ids as 404 and rejects unknown fields', async () => {
      await a.get('/notes/not-a-uuid').expect(404);
      await a.post('/notebooks').send({ name: 'ok', userId: 'someone-else' }).expect(400);
    });

    it('deleting a notebook cascades to its notes', async () => {
      await a.delete(`/notebooks/${notebookId}`).expect(204);
      await a.get(`/notes/${noteId}`).expect(404);
    });
  });
});
