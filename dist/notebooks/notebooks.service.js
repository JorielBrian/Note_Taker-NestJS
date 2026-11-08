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
exports.NotebooksService = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_module_1 = require("../db/db.module");
const schema_1 = require("../db/schema");
let NotebooksService = class NotebooksService {
    db;
    constructor(db) {
        this.db = db;
    }
    list(userId) {
        return this.db
            .select({ ...(0, drizzle_orm_1.getTableColumns)(schema_1.notebooks), noteCount: (0, drizzle_orm_1.count)(schema_1.notes.id) })
            .from(schema_1.notebooks)
            .leftJoin(schema_1.notes, (0, drizzle_orm_1.eq)(schema_1.notes.notebookId, schema_1.notebooks.id))
            .where((0, drizzle_orm_1.eq)(schema_1.notebooks.userId, userId))
            .groupBy(schema_1.notebooks.id)
            .orderBy((0, drizzle_orm_1.asc)(schema_1.notebooks.name));
    }
    async create(userId, name) {
        const [created] = await this.db.insert(schema_1.notebooks).values({ userId, name }).returning();
        return { ...created, noteCount: 0 };
    }
    async rename(userId, id, name) {
        const [updated] = await this.db
            .update(schema_1.notebooks)
            .set({ name, updatedAt: new Date() })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notebooks.id, id), (0, drizzle_orm_1.eq)(schema_1.notebooks.userId, userId)))
            .returning();
        if (!updated)
            throw new common_1.NotFoundException('Notebook not found');
        return updated;
    }
    async remove(userId, id) {
        const deleted = await this.db
            .delete(schema_1.notebooks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.notebooks.id, id), (0, drizzle_orm_1.eq)(schema_1.notebooks.userId, userId)))
            .returning({ id: schema_1.notebooks.id });
        if (deleted.length === 0)
            throw new common_1.NotFoundException('Notebook not found');
    }
};
exports.NotebooksService = NotebooksService;
exports.NotebooksService = NotebooksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(db_module_1.DB)),
    __metadata("design:paramtypes", [Object])
], NotebooksService);
//# sourceMappingURL=notebooks.service.js.map