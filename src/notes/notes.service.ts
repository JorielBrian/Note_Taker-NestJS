import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { notebooks, notes } from '../db/schema';
import type { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async assertNotebookOwned(userId: string, notebookId: string): Promise<void> {
    const [row] = await this.db
      .select({ id: notebooks.id })
      .from(notebooks)
      .where(and(eq(notebooks.id, notebookId), eq(notebooks.userId, userId)))
      .limit(1);
    if (!row) throw new NotFoundException('Notebook not found');
  }

  async listInNotebook(userId: string, notebookId: string) {
    await this.assertNotebookOwned(userId, notebookId);
    return this.db
      .select({
        id: notes.id,
        notebookId: notes.notebookId,
        title: notes.title,
        snippet: sql<string>`left(${notes.content}, 140)`,
        updatedAt: notes.updatedAt,
      })
      .from(notes)
      .where(and(eq(notes.notebookId, notebookId), eq(notes.userId, userId)))
      .orderBy(desc(notes.updatedAt));
  }

  async create(userId: string, notebookId: string, dto: CreateNoteDto) {
    await this.assertNotebookOwned(userId, notebookId);
    const [created] = await this.db
      .insert(notes)
      .values({ userId, notebookId, title: dto.title ?? '', content: dto.content ?? '' })
      .returning();
    return created;
  }

  async get(userId: string, id: string) {
    const [note] = await this.db
      .select()
      .from(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .limit(1);
    if (!note) throw new NotFoundException('Note not found');
    return note;
  }

  async update(userId: string, id: string, dto: UpdateNoteDto) {
    if (dto.notebookId) await this.assertNotebookOwned(userId, dto.notebookId);
    const changes = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.content !== undefined && { content: dto.content }),
      ...(dto.notebookId !== undefined && { notebookId: dto.notebookId }),
      updatedAt: new Date(),
    };
    const [updated] = await this.db
      .update(notes)
      .set(changes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundException('Note not found');
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(notes)
      .where(and(eq(notes.id, id), eq(notes.userId, userId)))
      .returning({ id: notes.id });
    if (deleted.length === 0) throw new NotFoundException('Note not found');
  }
}
