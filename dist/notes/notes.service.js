"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
let NotesService = class NotesService {
    db;
    constructor(db) {
        this.db = db;
    }
    async assertNotebookOwned(userId, notebookId) {
        const [row] = await this.db
            .select({ id: schema_1.notebooks.id })
            .from(schema_1.notebooks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notebooks.id, notebookId), (0, drizzle_orm_1.eq)(schema_1.notebooks.userId, userId)))
            .limit(1);
        if (!row)
            throw new common_1.NotFoundException('Notebook not found');
    }
    async listInNotebook(userId, notebookId) {
        await this.assertNotebookOwned(userId, notebookId);
        return this.db
            .select({
            id: schema_1.notes.id,
            notebookId: schema_1.notes.notebookId,
            title: schema_1.notes.title,
            snippet: (0, drizzle_orm_1.sql) `left(${schema_1.notes.content}, 140)`,
            updatedAt: schema_1.notes.updatedAt,
        })
            .from(schema_1.notes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.notebookId, notebookId), (0, drizzle_orm_1.eq)(schema_1.notes.userId, userId)))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.notes.updatedAt));
    }
    async create(userId, notebookId, dto) {
        await this.assertNotebookOwned(userId, notebookId);
        const [created] = await this.db
            .insert(schema_1.notes)
            .values({ userId, notebookId, title: dto.title ?? '', content: dto.content ?? '' })
            .returning();
        return created;
    }
    async get(userId, id) {
        const [note] = await this.db
            .select()
            .from(schema_1.notes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.id, id), (0, drizzle_orm_1.eq)(schema_1.notes.userId, userId)))
            .limit(1);
        if (!note)
            throw new common_1.NotFoundException('Note not found');
        return note;
    }
    async update(userId, id, dto) {
        if (dto.notebookId)
            await this.assertNotebookOwned(userId, dto.notebookId);
        const changes = {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.content !== undefined && { content: dto.content }),
            ...(dto.notebookId !== undefined && { notebookId: dto.notebookId }),
            updatedAt: new Date(),
        };
        const [updated] = await this.db
            .update(schema_1.notes)
            .set(changes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.id, id), (0, drizzle_orm_1.eq)(schema_1.notes.userId, userId)))
            .returning();
        if (!updated)
            throw new common_1.NotFoundException('Note not found');
        return updated;
    }
    async remove(userId, id) {
        const deleted = await this.db
            .delete(schema_1.notes)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notes.id, id), (0, drizzle_orm_1.eq)(schema_1.notes.userId, userId)))
            .returning({ id: schema_1.notes.id });
        if (deleted.length === 0)
            throw new common_1.NotFoundException('Note not found');
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], NotesService);
//# sourceMappingURL=notes.service.js.map