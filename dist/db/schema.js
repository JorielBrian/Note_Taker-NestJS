"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notes = exports.notebooks = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    username: (0, pg_core_1.varchar)('username', { length: 30 }).notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
});
exports.notebooks = (0, pg_core_1.pgTable)('notebooks', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    name: (0, pg_core_1.varchar)('name', { length: 100 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [(0, pg_core_1.index)('notebooks_user_idx').on(t.userId)]);
exports.notes = (0, pg_core_1.pgTable)('notes', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    notebookId: (0, pg_core_1.uuid)('notebook_id')
        .notNull()
        .references(() => exports.notebooks.id, { onDelete: 'cascade' }),
    // Denormalised owner: every query filters on it, no join needed for ownership checks.
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    title: (0, pg_core_1.varchar)('title', { length: 200 }).notNull().default(''),
    content: (0, pg_core_1.text)('content').notNull().default(''),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
    (0, pg_core_1.index)('notes_notebook_updated_idx').on(t.notebookId, t.updatedAt),
    (0, pg_core_1.index)('notes_user_idx').on(t.userId),
]);
//# sourceMappingURL=schema.js.map