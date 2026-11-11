import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, eq, getTableColumns } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { notebooks, notes } from '../db/schema';

@Injectable()
export class NotebooksService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list(userId: string) {
    return this.db
      .select({ ...getTableColumns(notebooks), noteCount: count(notes.id) })
      .from(notebooks)
      .leftJoin(notes, eq(notes.notebookId, notebooks.id))
      .where(eq(notebooks.userId, userId))
      .groupBy(notebooks.id)
      .orderBy(asc(notebooks.name));
  }

  async create(userId: string, name: string) {
    const [created] = await this.db.insert(notebooks).values({ userId, name }).returning();
    return { ...created, noteCount: 0 };
  }

  async rename(userId: string, id: string, name: string) {
    const [updated] = await this.db
      .update(notebooks)
      .set({ name, updatedAt: new Date() })
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundException('Notebook not found');
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.db
      .delete(notebooks)
      .where(and(eq(notebooks.id, id), eq(notebooks.userId, userId)))
      .returning({ id: notebooks.id });
    if (deleted.length === 0) throw new NotFoundException('Notebook not found');
  }
}
